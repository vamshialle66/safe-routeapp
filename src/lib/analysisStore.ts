import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ApiRoute, BackendTravelMode, LatLng } from "./saferouteApi";

export interface NamedPoint extends LatLng {
  label: string;
}

export interface Analysis {
  id: string;
  createdAt: string;
  origin: NamedPoint;
  destination: NamedPoint;
  travelMode: BackendTravelMode;
  source: "live" | "demo";
  fallbackReason?: string;
  routes: ApiRoute[];
}

const CURRENT = "saferoute.analysis";
const HISTORY = "saferoute.history";
const SAVED = "saferoute.saved";

type Listener = () => void;
const listeners = new Set<Listener>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  try {
    value = raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    /* ignore */
  }
  cache.set(key, { raw, value });
  return value;
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota: drop place details from history */
  }
  listeners.forEach((l) => l());
}
function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const EMPTY: Analysis[] = [];

export interface SavedItem {
  id: string;
  analysisId: string;
  routeNumber: number;
  name: string;
  savedAt: string;
  /** Copy of the trip so saved routes never expire. */
  analysis?: Analysis | undefined;
}

let syncUser: string | null = null;
const asJson = (v: unknown) => v as Json;
function cloud(p: PromiseLike<{ error: unknown }>) {
  Promise.resolve(p).then(({ error }) => error && console.warn("Cloud sync failed", error));
}
const EMPTY_SAVED: SavedItem[] = [];

export const analysisStore = {
  current: () => read<Analysis | null>(CURRENT, null),
  history: () => read<Analysis[]>(HISTORY, EMPTY),
  saved: () => read<SavedItem[]>(SAVED, EMPTY_SAVED),
  setCurrent(a: Analysis) {
    write(CURRENT, a);
    const h = analysisStore.history().filter((x) => x.id !== a.id);
    write(HISTORY, [a, ...h].slice(0, 8));
    if (syncUser)
      cloud(supabase.from("trips").upsert({ id: a.id, user_id: syncUser, data: asJson(a), created_at: a.createdAt }));
  },
  open(id: string) {
    const a = analysisStore.history().find((x) => x.id === id);
    if (a) write(CURRENT, a);
    return a;
  },
  clearHistory() {
    write(HISTORY, []);
    if (syncUser) cloud(supabase.from("trips").delete().eq("user_id", syncUser));
  },
  openSaved(s: SavedItem) {
    if (s.analysis) write(CURRENT, s.analysis);
    else analysisStore.open(s.analysisId);
  },
  saveRoute(a: Analysis, routeNumber: number) {
    const list = analysisStore.saved();
    if (list.some((s) => s.analysisId === a.id && s.routeNumber === routeNumber)) return false;
    const item: SavedItem = {
      id: crypto.randomUUID(),
      analysisId: a.id,
      routeNumber,
      name: `${a.origin.label.split(",")[0]} → ${a.destination.label.split(",")[0]}`,
      savedAt: new Date().toISOString(),
      analysis: a,
    };
    write(SAVED, [item, ...list]);
    if (syncUser) cloud(supabase.from("saved_routes").insert(savedRow(item, syncUser)));
    return true;
  },
  removeSaved(id: string) {
    write(SAVED, analysisStore.saved().filter((s) => s.id !== id));
    if (syncUser) cloud(supabase.from("saved_routes").delete().eq("id", id));
  },
};

function savedRow(s: SavedItem, user_id: string) {
  return {
    id: s.id,
    user_id,
    analysis_id: s.analysisId,
    route_number: s.routeNumber,
    name: s.name,
    analysis: asJson(s.analysis ?? null),
    saved_at: s.savedAt,
  };
}

/** Sign-in: upload this device's trips/saved routes to the account, then load the account's data. */
export async function hydrateForUser(userId: string) {
  if (syncUser === userId) return;
  syncUser = userId;
  const localTrips = analysisStore.history();
  const localSaved = analysisStore.saved().map((s) => ({
    ...s,
    analysis: s.analysis ?? localTrips.find((t) => t.id === s.analysisId),
  }));
  if (localTrips.length)
    await supabase.from("trips").upsert(
      localTrips.map((a) => ({ id: a.id, user_id: userId, data: asJson(a), created_at: a.createdAt })),
      { ignoreDuplicates: true },
    );
  if (localSaved.length)
    await supabase.from("saved_routes").upsert(localSaved.map((s) => savedRow(s, userId)), {
      onConflict: "user_id,analysis_id,route_number",
      ignoreDuplicates: true,
    });
  const [trips, saved] = await Promise.all([
    supabase.from("trips").select("data").order("created_at", { ascending: false }).limit(8),
    supabase.from("saved_routes").select("*").order("saved_at", { ascending: false }),
  ]);
  if (syncUser !== userId) return;
  if (!trips.error) write(HISTORY, (trips.data ?? []).map((t) => t.data as unknown as Analysis));
  if (!saved.error)
    write(
      SAVED,
      (saved.data ?? []).map((r) => ({
        id: r.id,
        analysisId: r.analysis_id,
        routeNumber: r.route_number,
        name: r.name,
        savedAt: r.saved_at,
        analysis: (r.analysis as unknown as Analysis | null) ?? undefined,
      })),
    );
}

/** Sign-out: remove the account's data from this device. */
export function clearForSignOut() {
  if (!syncUser) return;
  syncUser = null;
  try {
    localStorage.removeItem(CURRENT);
  } catch {
    /* ignore */
  }
  write(HISTORY, []);
  write(SAVED, []);
}

export function useCurrentAnalysis() {
  return useSyncExternalStore(subscribe, analysisStore.current, () => null);
}
export function useHistory() {
  return useSyncExternalStore(subscribe, analysisStore.history, () => EMPTY);
}
export function useSaved() {
  return useSyncExternalStore(subscribe, analysisStore.saved, () => EMPTY_SAVED);
}
