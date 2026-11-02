/**
 * Client for the SafeRoute Express backend (backend/server.js).
 * Contract mirrors backend/docs/api.md + openapi.yaml:
 *   POST /location           -> nearby places + opening-status index
 *   POST /location/routes    -> alternative routes (no scoring)
 *   POST /location/segments  -> routes + segments + corridors + indices
 */

import type { RouteAssessment } from "./routeAssessment";
export type BackendTravelMode = "DRIVE" | "BICYCLE" | "WALK" | "TWO_WHEELER" | "TRANSIT";
export type SafetyStatus = "available" | "insufficient-data";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface ApiPlace {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  types?: string[];
  openNow?: boolean | null;
  businessStatus?: string;
}

export interface ApiSegment {
  segmentNumber: number;
  source: string;
  lengthMeters: number;
  geometry: LatLng[];
  places: ApiPlace[];
  placeCount: number;
  openPlaceCount: number;
  scoredPlaceCount: number;
  safetyIndex: number | null;
  safetyStatus: SafetyStatus;
}

export interface ApiRoute {
  assessment?: RouteAssessment;
  routeNumber: number;
  distanceMeters: number;
  duration: string;
  encodedPolyline?: string;
  segments: ApiSegment[];
  safetyIndex: number | null;
  safetyStatus: SafetyStatus;
  scoredSegmentCount: number;
  scoredLengthMeters: number;
}

export interface NearbyResponse {
  places: ApiPlace[];
  safetyIndex: number | null;
  safetyStatus: SafetyStatus;
  openPlaceCount: number;
  scoredPlaceCount: number;
}

export const TRAVEL_MODES: { value: BackendTravelMode; label: string }[] = [
  { value: "WALK", label: "Walk" },
  { value: "DRIVE", label: "Drive" },
  { value: "TWO_WHEELER", label: "Two-wheeler" },
  { value: "BICYCLE", label: "Cycle" },
  { value: "TRANSIT", label: "Transit" },
];

const URL_KEY = "saferoute.apiUrl";
const DEMO_KEY = "saferoute.demoOnly";
export const DEFAULT_API_URL = "http://localhost:3000";

export function getApiUrl() {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  return (localStorage.getItem(URL_KEY) || import.meta.env["VITE_SAFEROUTE_API_URL"] || DEFAULT_API_URL).replace(/\/$/, "");
}
export function setApiUrl(url: string) {
  if (url.trim()) localStorage.setItem(URL_KEY, url.trim());
  else localStorage.removeItem(URL_KEY);
}
/** A custom external server address, or "" to use the built-in Google Maps engine. */
export function getCustomApiUrl() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(URL_KEY) || import.meta.env["VITE_SAFEROUTE_API_URL"] || "";
}
export function getDemoOnly() {
  return typeof window !== "undefined" && localStorage.getItem(DEMO_KEY) === "1";
}
export function setDemoOnly(v: boolean) {
  localStorage.setItem(DEMO_KEY, v ? "1" : "0");
}

export class ApiError extends Error {
  constructor(message: string, public status?: number, public unreachable = false) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown, timeoutMs = 45000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError("Could not reach the SafeRoute engine.", undefined, true);
  } finally {
    clearTimeout(t);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      res.status === 400
        ? "Those locations couldn't be used. Check the start and destination."
        : res.status === 502
          ? "The map provider didn't respond. Please try again."
          : data?.message || data?.error || "Something went wrong analysing routes.";
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const saferouteApi = {
  segments: (origin: LatLng, destination: LatLng, travelMode: BackendTravelMode) =>
    post<{ routes: ApiRoute[] }>("/location/segments", { origin, destination, travelMode }),
  nearby: (p: LatLng) => post<NearbyResponse>("/location", p, 20000),
  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${getApiUrl()}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      return res.status === 400 || res.ok; // validation error = server alive
    } catch {
      return false;
    }
  },
};

/* ---------------- formatting helpers ---------------- */

export function durationSeconds(d: string) {
  const n = parseFloat(d);
  return Number.isFinite(n) ? n : 0;
}
export function formatDuration(d: string) {
  const s = durationSeconds(d);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${Math.max(m, 1)} min`;
}
export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}
export type IndexTone = "safe" | "moderate" | "risk" | "none";
export function indexTone(v: number | null | undefined): IndexTone {
  if (v == null || !Number.isFinite(v)) return "none";
  if (v >= 70) return "safe";
  if (v >= 40) return "moderate";
  return "risk";
}
export function formatIndex(v: number | null | undefined) {
  return v == null || !Number.isFinite(v) ? "N/A" : v.toFixed(0);
}

/** Routes tied for the highest available index (N/A never ranks). */
export function topRouteNumbers(routes: ApiRoute[]) {
  if (routes.some(r => r.assessment)) {
    const eligible = routes.filter(r => r.assessment?.score != null);
    if (!eligible.length) return new Set<number>();
    const best = Math.max(...eligible.map(r => r.assessment?.score ?? -1));
    return new Set(eligible.filter(r => r.assessment?.score === best).map(r => r.routeNumber));
  }
  const scored = routes.filter((r) => r.safetyStatus === "available" && r.safetyIndex != null);
  if (!scored.length) return new Set<number>();
  const best = Math.max(...scored.map((r) => r.safetyIndex as number));
  return new Set(scored.filter((r) => Math.abs((r.safetyIndex as number) - best) < 0.005).map((r) => r.routeNumber));
}

export function routeGeometry(route: ApiRoute): LatLng[] {
  if (route.segments?.length) {
    const pts: LatLng[] = [];
    route.segments.forEach((s) => s.geometry.forEach((p) => pts.push(p)));
    return pts;
  }
  return route.encodedPolyline ? decodePolyline(route.encodedPolyline) : [];
}

export function decodePolyline(str: string): LatLng[] {
  let index = 0, lat = 0, lng = 0;
  const out: LatLng[] = [];
  while (index < str.length) {
    for (const which of [0, 1]) {
      let result = 0, shift = 0, b: number;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta;
      else lng += delta;
    }
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}
