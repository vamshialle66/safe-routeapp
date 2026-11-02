import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ApiRoute, BackendTravelMode, LatLng, NearbyResponse } from "./saferouteApi";

const MODES: BackendTravelMode[] = ["DRIVE", "BICYCLE", "WALK", "TWO_WHEELER", "TRANSIT"];

function point(p: unknown): LatLng {
  const q = p as LatLng;
  if (!q || !Number.isFinite(q.latitude) || !Number.isFinite(q.longitude) || Math.abs(q.latitude) > 90 || Math.abs(q.longitude) > 180)
    throw new Error("Invalid coordinates");
  return { latitude: Number(q.latitude), longitude: Number(q.longitude) };
}

function cats(c: unknown): string[] | undefined {
  return Array.isArray(c) ? c.filter((x): x is string => typeof x === "string").slice(0, 30) : undefined;
}

export type EngineResult<T> = { ok: true; data: T } | { ok: false; reason: string };

export const liveSegmentsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { origin: LatLng; destination: LatLng; travelMode: BackendTravelMode; categories?: string[] }) => {
    if (!MODES.includes(d?.travelMode)) throw new Error("Invalid travel mode");
    return { origin: point(d.origin), destination: point(d.destination), travelMode: d.travelMode, categories: cats(d.categories) };
  })
  .handler(async ({ data, context }): Promise<EngineResult<{ routes: ApiRoute[] }>> => {
    const { liveSegments } = await import("./engine.server");
    try {
      const result = await liveSegments(data.origin, data.destination, data.travelMode, data.categories);
      const { attachPoliceEvidence } = await import("./crimeEvidence.server");
      const { attachMappedLighting } = await import("./lightingEvidence.server");
      return { ok: true, data: { routes: attachMappedLighting(await attachPoliceEvidence(result.routes, context.supabase)) } };
    } catch (e) {
      console.error("liveSegments failed", e);
      return { ok: false, reason: e instanceof Error ? e.message : "Live service unavailable." };
    }
  });

export const liveNearbyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: LatLng & { categories?: string[] }) => ({ ...point(d), categories: cats(d?.categories) }))
  .handler(async ({ data }): Promise<EngineResult<NearbyResponse>> => {
    const { liveNearby } = await import("./engine.server");
    try {
      return { ok: true, data: await liveNearby({ latitude: data.latitude, longitude: data.longitude }, data.categories) };
    } catch (e) {
      console.error("liveNearby failed", e);
      return { ok: false, reason: e instanceof Error ? e.message : "Live service unavailable." };
    }
  });
