import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ApiRoute } from "./saferouteApi";
import { crimeEvidence, policeDatasetSchema, policeRecordSchema } from "./crimeEvidence";
import { assessRoute } from "./routeAssessment";

export async function attachPoliceEvidence(routes: ApiRoute[], client: SupabaseClient<Database>) {
  try {
    const sources = await client.from("mumbai_crime_datasets").select("*").not("reviewed_at", "is", null).order("period_end", { ascending: false }).limit(101);
    if (sources.error || (sources.data?.length ?? 0) > 100) throw new Error("Police source query incomplete");
    const datasets = (sources.data ?? []).map(d => ({ ...policeDatasetSchema.parse(d), id: d.id }));
    const rows = datasets.length ? await client.from("mumbai_crime_reports").select("*").in("dataset_id", datasets.map(d => d.id)).limit(10001) : { data: [], error: null };
    if (rows.error || (rows.data?.length ?? 0) > 10000) throw new Error("Police record query incomplete");
    const records = (rows.data ?? []).map(r => ({ ...policeRecordSchema.parse(r), dataset_id: r.dataset_id }));
    return routes.map(r => {
      const base = r.assessment ?? assessRoute(r);
      const crime = crimeEvidence(r, datasets, records);
      return { ...r, assessment: { ...base, version: 2 as const, score: base.score == null ? null : Math.max(0, base.score - (crime.adjustment ?? 0)), crime } };
    });
  } catch (e) {
    console.error("Police evidence could not be loaded", e instanceof Error ? e.message : "Unknown failure");
    return routes.map(r => ({ ...r, assessment: { ...(r.assessment ?? assessRoute(r)), crime: { status: "unreachable" as const, checkedAt: new Date().toISOString(), nearbyIncidents: 0, reviewedRecords: 0, adjustment: null, sources: [] } } }));
  }
}