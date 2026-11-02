import { z } from "zod";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanWithin from "@turf/boolean-within";
import pointToLineDistance from "@turf/point-to-line-distance";
import { lineString, point, polygon } from "@turf/helpers";
import type { ApiRoute } from "./saferouteApi";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
const coordinates = z.tuple([z.number().min(72.7).max(73.15), z.number().min(18.85).max(19.55)]);
export const policeDatasetSchema = z.object({
  source_url: z.string().url().refine(v => { const u = new URL(v); return u.protocol === "https:" && (u.hostname === "mumbaipolice.gov.in" || u.hostname.endsWith(".mumbaipolice.gov.in")); }),
  title: z.string().trim().min(1).max(240), period_start: date, period_end: date,
  content_sha256: z.string().regex(/^[a-f0-9]{64}$/), completeness: z.enum(["partial", "complete"]),
  coverage_geojson: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(coordinates).min(4)).min(1) }).nullable(),
  methodology: z.string().trim().min(30).max(4000), reviewed_at: z.string().datetime({ offset: true }),
}).superRefine((v, ctx) => {
  if (v.period_end < v.period_start) ctx.addIssue({ code: "custom", message: "Reporting dates are reversed" });
  if (v.completeness === "complete" && !v.coverage_geojson) ctx.addIssue({ code: "custom", message: "Complete records require a verified coverage boundary" });
  for (const ring of v.coverage_geojson?.coordinates ?? []) {
    if (JSON.stringify(ring[0]) !== JSON.stringify(ring[ring.length - 1])) ctx.addIssue({ code: "custom", message: "Coverage boundary must be closed" });
  }
});
export const policeRecordSchema = z.object({
  source_record_id: z.string().trim().min(1).max(200), category: z.enum(["violence", "harassment", "robbery", "theft", "other"]),
  occurred_on: date.nullable(), location_label: z.string().trim().min(1).max(240),
  location_precision: z.enum(["street", "area", "police_station"]),
  latitude: z.number().min(18.85).max(19.55).nullable(), longitude: z.number().min(72.7).max(73.15).nullable(),
  incident_count: z.number().int().min(1).max(1000000), source_locator: z.string().trim().min(1).max(240),
}).superRefine((v, ctx) => {
  if ((v.latitude == null) !== (v.longitude == null) || (v.location_precision === "street" && (v.latitude == null || v.occurred_on == null))) ctx.addIssue({ code: "custom", message: "Street evidence requires verified coordinates and incident date" });
});
export type PoliceDataset = z.infer<typeof policeDatasetSchema> & { id: string };
export type PoliceRecord = z.infer<typeof policeRecordSchema> & { dataset_id: string };
export interface CrimeEvidence {
  status: "no-coverage" | "partial" | "covered" | "unreachable";
  checkedAt: string; nearbyIncidents: number; reviewedRecords: number;
  adjustment: number | null; periodStart?: string; periodEnd?: string;
  sources: { title: string; url: string }[];
}

/** Historical report context, never a prediction or proof of absence.
 * Only complete, recent records covering the whole route can change a comparison.
 */
export function crimeEvidence(route: ApiRoute, datasets: PoliceDataset[], records: PoliceRecord[], now = new Date()): CrimeEvidence {
  const geometry = route.segments.flatMap(s => s.geometry).map(p => [p.longitude, p.latitude]);
  const result: CrimeEvidence = { status: "no-coverage", checkedAt: now.toISOString(), nearbyIncidents: 0, reviewedRecords: records.length, adjustment: null, sources: datasets.map(d => ({ title: d.title, url: d.source_url })) };
  if (geometry.length < 2) return result;
  const line = lineString(geometry);
  // Latest complete reporting period only; never add overlapping dataset counts.
  const full = datasets.filter(d => d.completeness === "complete" && d.coverage_geojson &&
    Date.parse(d.period_end) <= now.getTime() && now.getTime() - Date.parse(d.period_end) <= 90 * 86400000 &&
    Date.parse(d.period_end) - Date.parse(d.period_start) >= 27 * 86400000 &&
    booleanWithin(line, polygon(d.coverage_geojson.coordinates)) &&
    geometry.every(p => booleanPointInPolygon(point(p), polygon(d.coverage_geojson?.coordinates ?? [])))
  ).sort((a, b) => b.period_end.localeCompare(a.period_end))[0];
  const available = full ? records.filter(r => r.dataset_id === full.id) : records;
  const seen = new Set<string>();
  for (const r of available) {
    if (r.location_precision !== "street" || r.latitude == null || r.longitude == null || !r.occurred_on) continue;
    const age = now.getTime() - Date.parse(r.occurred_on);
    if (age < 0 || age > 365 * 86400000) continue;
    if (full && (r.occurred_on < full.period_start || r.occurred_on > full.period_end)) continue;
    if (pointToLineDistance(point([r.longitude, r.latitude]), line, { units: "meters" }) > 250) continue;
    const key = r.source_record_id;
    if (seen.has(key)) continue;
    seen.add(key); result.nearbyIncidents += r.incident_count;
  }
  if (full) {
    result.status = "covered"; result.periodStart = full.period_start; result.periodEnd = full.period_end;
    result.sources = [{ title: full.title, url: full.source_url }];
    // Explicit experimental adjustment: 2 points per reported incident, capped at 20.
    // No incidents gives zero adjustment, never a positive safety bonus.
    result.adjustment = Math.min(20, result.nearbyIncidents * 2);
  } else if (result.nearbyIncidents) result.status = "partial";
  return result;
}