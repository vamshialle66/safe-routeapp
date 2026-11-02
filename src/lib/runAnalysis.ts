import { getScoreCategories } from "./placeCategories";
import { typesFor } from "./placeCategories";
import { assessRoute } from "./routeAssessment";
import { analysisStore, type Analysis, type NamedPoint } from "./analysisStore";
import { demoSegments } from "./demoAnalysis";
import { liveNearbyFn, liveSegmentsFn } from "./engine.functions";
import { supabase } from "@/integrations/supabase/client";
import { ApiError, getCustomApiUrl, saferouteApi, type ApiRoute, type BackendTravelMode, type LatLng, type NearbyResponse } from "./saferouteApi";
import { requireLiveData } from "./liveDataPolicy";

type Live<T> = { ok: true; data: T } | { ok: false; reason: string };

async function external<T>(call: () => Promise<T>): Promise<Live<T>> {
  try {
    return { ok: true, data: await call() };
  } catch (e) {
    if (e instanceof ApiError && e.unreachable) return { ok: false, reason: "Your SafeRoute server couldn't be reached." };
    throw e;
  }
}

async function builtIn<T>(call: () => Promise<Live<T>>): Promise<Live<T>> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return { ok: false, reason: "Sign in to find real routes and current nearby places." };
    return await call();
  } catch {
    return { ok: false, reason: "The live service couldn't be reached." };
  }
}

/** Try the custom server (if set); if it can't be reached, use the built-in Google engine. */
async function withBuiltInBackup<T>(ext: () => Promise<T>, own: () => Promise<Live<T>>): Promise<Live<T>> {
  if (getCustomApiUrl()) {
    const r = await external(ext);
    if (r.ok) return r;
  }
  return builtIn(own);
}

/** Live nearby places: custom server if set, else built-in Google engine. */
export function fetchNearby(p: LatLng): Promise<Live<NearbyResponse>> {
  return withBuiltInBackup(
    () => saferouteApi.nearby(p),
    () => liveNearbyFn({ data: { ...p, categories: getScoreCategories() } }),
  );
}

export async function runAnalysis(
  origin: NamedPoint,
  destination: NamedPoint,
  travelMode: BackendTravelMode,
  sample = false,
): Promise<{ analysis: Analysis; fellBack: boolean; reason?: string }> {
  let source: Analysis["source"] = "live";
  let routes: ApiRoute[];
  if (sample) {
    source = "demo";
    await new Promise((r) => setTimeout(r, 900));
    routes = demoSegments(origin, destination, travelMode).routes;
  } else {
    const o = { latitude: origin.latitude, longitude: origin.longitude };
    const d = { latitude: destination.latitude, longitude: destination.longitude };
    const r = await withBuiltInBackup(
      () => saferouteApi.segments(o, d, travelMode),
      () => liveSegmentsFn({ data: { origin: o, destination: d, travelMode, categories: getScoreCategories() } }),
    );
    routes = requireLiveData(r).routes;
    if (!routes.length) throw new Error("No route was found. Try different locations or a different travel mode.");
  }
  routes = routes.map(route => ({ ...route, assessment: route.assessment ?? assessRoute(route, undefined, new Set(typesFor(getScoreCategories()))) }));
  const analysis: Analysis = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    origin,
    destination,
    travelMode,
    source,
    routes,
  };
  analysisStore.setCurrent(analysis);
  return { analysis, fellBack: false };
}
