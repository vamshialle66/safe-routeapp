import { placeCounts, typesFor } from "./placeCategories";
import { assessRoute } from "./routeAssessment";
/**
 * Built-in SafeRoute engine (server-only). Ports the friend's Express backend rules:
 * ~100 m segments, narrow corridor, index = % of scored places open right now,
 * route index = length-weighted over scored segments, null when no data.
 * Live data comes from Google Routes API + Places API (New) via the connector gateway.
 */
import type { ApiPlace, ApiRoute, ApiSegment, BackendTravelMode, LatLng, NearbyResponse } from "./saferouteApi";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
const SEGMENT_M = 100;
const CORRIDOR_M = 30;
const SAMPLE_EVERY_M = 400;
const SAMPLE_RADIUS_M = 250;
const MAX_SAMPLES_PER_ROUTE = 12;
const MAX_ROUTES = 3;
const MAX_TRIP_M = 60_000;

export class EngineError extends Error {
  constructor(message: string, public code: "config" | "provider" | "input" | "no_route") {
    super(message);
  }
}

function creds() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const maps = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovable || !maps) throw new EngineError("Live map service is not configured.", "config");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": maps, "Content-Type": "application/json" };
}

async function gateway<T>(path: string, body: unknown, fieldMask: string): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: { ...creds(), "X-Goog-FieldMask": fieldMask },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Google Maps gateway ${path} failed [${res.status}]: ${text}`);
    if (res.status === 403) throw new EngineError("Google Maps refused the request (403). Check the key's allowed APIs.", "provider");
    throw new EngineError(`Google Maps request failed (${res.status}).`, "provider");
  }
  return (await res.json()) as T;
}

/* ---------- geometry ---------- */
const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
export function dist(a: LatLng, b: LatLng) {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t };
}
/** Distance from p to segment ab in metres (local equirectangular). */
function distToSeg(p: LatLng, a: LatLng, b: LatLng) {
  const k = Math.cos(rad(p.latitude));
  const ax = (a.longitude - p.longitude) * k, ay = a.latitude - p.latitude;
  const bx = (b.longitude - p.longitude) * k, by = b.latitude - p.latitude;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
  const x = ax + t * dx, y = ay + t * dy;
  return Math.sqrt(x * x + y * y) * (Math.PI / 180) * R;
}

/** Split a polyline into ~100 m pieces. */
export function splitLine(pts: LatLng[], step = SEGMENT_M): LatLng[][] {
  const out: LatLng[][] = [];
  if (pts.length < 2) return out;
  let cur: LatLng[] = [pts[0]!];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = cur[cur.length - 1]!;
    const b = pts[i]!;
    let d = dist(a, b);
    while (acc + d >= step && d > 0) {
      const cut = lerp(a, b, (step - acc) / d);
      cur.push(cut);
      out.push(cur);
      cur = [cut];
      a = cut;
      d = dist(a, b);
      acc = 0;
    }
    acc += d;
    cur.push(b);
  }
  if (cur.length > 1 && acc > 1) out.push(cur);
  return out;
}
function lineLength(pts: LatLng[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1]!, pts[i]!);
  return s;
}

/* ---------- index rules (shared with demo) ---------- */
export function placeIndex(places: ApiPlace[], allowed?: Set<string>) {
  const scored = places.filter((p) => typeof p.openNow === "boolean" && placeCounts(p.types, allowed));
  const open = scored.filter((p) => p.openNow).length;
  return {
    scoredPlaceCount: scored.length,
    openPlaceCount: open,
    safetyIndex: scored.length ? (open / scored.length) * 100 : null,
  };
}
export function scoreSegments(lines: LatLng[][], places: ApiPlace[], allowed?: Set<string>): ApiSegment[] {
  return lines.map((geometry, i) => {
    const near = places.filter((p) =>
      geometry.some((a, j) => j > 0 && distToSeg(p, geometry[j - 1]!, a) <= CORRIDOR_M),
    );
    const idx = placeIndex(near, allowed);
    return {
      segmentNumber: i + 1,
      source: "google",
      lengthMeters: Math.round(lineLength(geometry)),
      geometry,
      places: near,
      placeCount: near.length,
      ...idx,
      safetyStatus: idx.safetyIndex == null ? "insufficient-data" : "available",
    };
  });
}
export function routeIndex(segments: ApiSegment[]) {
  const scored = segments.filter((s) => s.safetyIndex != null);
  const len = scored.reduce((s, x) => s + x.lengthMeters, 0);
  const v = len ? scored.reduce((s, x) => s + (x.safetyIndex as number) * x.lengthMeters, 0) / len : null;
  return { safetyIndex: v, scoredSegmentCount: scored.length, scoredLengthMeters: len };
}

/* ---------- Google calls ---------- */
interface GPlace {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude: number; longitude: number };
  types?: string[];
  businessStatus?: string;
  currentOpeningHours?: { openNow?: boolean };
}
const PLACE_MASK =
  "places.id,places.displayName,places.location,places.types,places.businessStatus,places.currentOpeningHours.openNow";

/** Only places that mean people are around: shops, food, pharmacies, fuel, police, hospitals, transit, hotels, toilets, fire stations, ATMs, post offices. */
export const USEFUL_TYPES = [
  "convenience_store", "supermarket", "grocery_store", "store", "department_store", "shopping_mall",
  "clothing_store", "electronics_store", "hardware_store", "liquor_store", "book_store",
  "pharmacy", "drugstore", "hospital", "police", "fire_station",
  "restaurant", "cafe", "fast_food_restaurant", "bakery", "meal_takeaway", "bar",
  "gas_station", "bank", "atm", "post_office", "hotel", "lodging", "public_bathroom",
  "bus_station", "train_station", "subway_station", "transit_station",
];

const placeCache = new Map<string, { at: number; places: ApiPlace[] }>();
const CACHE_MS = 5 * 60_000;

async function nearbyPlaces(p: LatLng, radius: number): Promise<ApiPlace[]> {
  const key = `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)},${radius}`;
  const hit = placeCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places;
  const data = await gateway<{ places?: GPlace[] }>(
    "/places/v1/places:searchNearby",
    {
      maxResultCount: 20,
      includedTypes: USEFUL_TYPES,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { center: p, radius } },
    },
    PLACE_MASK,
  );
  const places: ApiPlace[] = (data.places ?? [])
    .filter((g) => g.location)
    .map((g) => {
      const closed = g.businessStatus && g.businessStatus !== "OPERATIONAL";
      const open = g.currentOpeningHours?.openNow;
      return {
        id: g.id ?? `${g.location!.latitude},${g.location!.longitude}`,
        name: g.displayName?.text ?? "Unnamed place",
        latitude: g.location!.latitude,
        longitude: g.location!.longitude,
        types: g.types ?? [],
        businessStatus: g.businessStatus ?? "UNKNOWN",
        openNow: closed ? false : typeof open === "boolean" ? open : null,
      };
    });
  placeCache.set(key, { at: Date.now(), places });
  if (placeCache.size > 500) placeCache.delete(placeCache.keys().next().value!);
  return places;
}

function decode(str: string): LatLng[] {
  let i = 0, lat = 0, lng = 0;
  const out: LatLng[] = [];
  while (i < str.length) {
    for (const w of [0, 1]) {
      let r = 0, s = 0, b: number;
      do {
        b = str.charCodeAt(i++) - 63;
        r |= (b & 0x1f) << s;
        s += 5;
      } while (b >= 0x20);
      const d = r & 1 ? ~(r >> 1) : r >> 1;
      if (w === 0) lat += d;
      else lng += d;
    }
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}

/** Evenly spaced sample points along a line, capped. */
function samplePoints(pts: LatLng[]) {
  const total = lineLength(pts);
  const n = Math.min(MAX_SAMPLES_PER_ROUTE, Math.max(1, Math.ceil(total / SAMPLE_EVERY_M)));
  const out: LatLng[] = [];
  const pieces = splitLine(pts, total / n);
  pieces.forEach((g) => out.push(g[Math.floor(g.length / 2)]!));
  return out.slice(0, MAX_SAMPLES_PER_ROUTE);
}

async function mapLimit<T, U>(items: T[], limit: number, fn: (x: T) => Promise<U>) {
  const out: U[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]!);
      }
    }),
  );
  return out;
}

export function validPoint(p: unknown): p is LatLng {
  const q = p as LatLng;
  return (
    !!q && Number.isFinite(q.latitude) && Number.isFinite(q.longitude) &&
    Math.abs(q.latitude) <= 90 && Math.abs(q.longitude) <= 180
  );
}

export async function liveSegments(origin: LatLng, destination: LatLng, travelMode: BackendTravelMode, categories?: string[]) {
  const allowed = categories ? new Set(typesFor(categories)) : undefined;
  if (dist(origin, destination) > MAX_TRIP_M) throw new EngineError("Trips are limited to 60 km for live analysis.", "input");
  const body: Record<string, unknown> = {
    origin: { location: { latLng: origin } },
    destination: { location: { latLng: destination } },
    travelMode,
    computeAlternativeRoutes: travelMode !== "TRANSIT",
  };
  if (travelMode === "DRIVE" || travelMode === "TWO_WHEELER") body["routingPreference"] = "TRAFFIC_AWARE";
  const data = await gateway<{ routes?: { distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }[] }>(
    "/routes/directions/v2:computeRoutes",
    body,
    "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
  );
  const raw = (data.routes ?? []).filter((r) => r.polyline?.encodedPolyline && r.duration).slice(0, MAX_ROUTES);
  if (!raw.length) throw new EngineError("No route was found between these places for this travel mode.", "no_route");

  const routes: ApiRoute[] = [];
  for (const [i, r] of raw.entries()) {
    const pts = decode(r.polyline!.encodedPolyline!);
    const lists = await mapLimit(samplePoints(pts), 4, (p) => nearbyPlaces(p, SAMPLE_RADIUS_M));
    const byId = new Map<string, ApiPlace>();
    lists.flat().forEach((p) => byId.set(p.id ?? `${p.latitude},${p.longitude}`, p));
    const segments = scoreSegments(splitLine(pts), [...byId.values()], allowed);
    const idx = routeIndex(segments);
    const route: ApiRoute = {
      routeNumber: i + 1,
      distanceMeters: r.distanceMeters ?? 0,
      duration: r.duration!,
      encodedPolyline: r.polyline!.encodedPolyline!,
      segments,
      ...idx,
      safetyStatus: idx.safetyIndex == null ? "insufficient-data" : "available",
    };
    route.assessment = assessRoute(route, [...byId.values()], allowed);
    routes.push(route);
  }
  return { routes };
}

export async function liveNearby(p: LatLng, categories?: string[]): Promise<NearbyResponse> {
  const places = await nearbyPlaces(p, 500);
  const idx = placeIndex(places, categories ? new Set(typesFor(categories)) : undefined);
  return { places, ...idx, safetyStatus: idx.safetyIndex == null ? "insufficient-data" : "available" };
}
