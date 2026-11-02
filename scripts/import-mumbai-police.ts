/** Offline/local-only curated import. Never imported by the app. */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { z } from "zod";
import { policeDatasetSchema, policeRecordSchema } from "../src/lib/crimeEvidence";

const [jsonPath, originalPdf] = process.argv.slice(2);
if (!jsonPath || !originalPdf || !process.env.LOCAL_CRIME_DATABASE_URL) throw new Error("Provide curated JSON, original report PDF and LOCAL_CRIME_DATABASE_URL in your local environment.");
const batch = z.object({ dataset: policeDatasetSchema, records: z.array(policeRecordSchema).max(10000) }).parse(JSON.parse(await readFile(jsonPath, "utf8")));
const hash = createHash("sha256").update(await readFile(originalPdf)).digest("hex");
if (hash !== batch.dataset.content_sha256) throw new Error("Original police report hash does not match.");
if (new Set(batch.records.map(r => r.source_record_id)).size !== batch.records.length) throw new Error("Duplicate source record IDs.");
for (const r of batch.records) if (r.occurred_on && (r.occurred_on < batch.dataset.period_start || r.occurred_on > batch.dataset.period_end)) throw new Error("Incident date outside the reporting period.");
const sql = postgres(process.env.LOCAL_CRIME_DATABASE_URL, { max: 1 });
try {
  await sql.begin(async tx => {
    const d = { ...batch.dataset, coverage_geojson: batch.dataset.coverage_geojson == null ? null : JSON.stringify(batch.dataset.coverage_geojson) };
    const rows = await tx`INSERT INTO public.mumbai_crime_datasets ${tx(d)} ON CONFLICT (source_url, content_sha256) DO NOTHING RETURNING id`;
    const existing = rows.length ? rows : await tx`SELECT id FROM public.mumbai_crime_datasets WHERE source_url = ${d.source_url} AND content_sha256 = ${d.content_sha256}`;
    const id = existing[0]?.id;
    if (!id) throw new Error("Source was not stored");
    for (const record of batch.records) await tx`INSERT INTO public.mumbai_crime_reports ${tx({ ...record, dataset_id: id })} ON CONFLICT (dataset_id, source_record_id) DO NOTHING`;
  });
  console.log(`Imported ${batch.records.length} curated police records; repeated imports do not create duplicates.`);
} finally { await sql.end(); }