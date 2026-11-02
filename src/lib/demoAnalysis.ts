import type { ApiPlace, ApiRoute, ApiSegment, BackendTravelMode, LatLng, NearbyResponse } from "./saferouteApi";

/**
 * Offline demo generator that follows the backend's own rules
 * (~100 m segments, places inside a 20 m corridor, index = % open places,
 * route index = length-weighted average, null when no data).
 */

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const R = 6371000;
function haversine(a: LatLng, b: LatLng) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const NAMES = ["Chai Point", "Apollo Pharmacy", "Metro Station Gate", "24/7 Mart", "City Hospital", "Police Chowki", "Café Madras", "Petrol Pump", "Bus Depot", "Bookstore", "Bakery", "ATM Kiosk", "Hotel Lobby", "Clinic", "Supermarket"];
const TYPES = [["cafe"], ["pharmacy"], ["transit_station"], ["convenience_store"], ["hospital"], ["police"], ["restaurant"], ["gas_station"], ["bus_station"], ["book_store"], ["bakery"], ["atm"], ["lodging"], ["doctor"], ["supermarket"], ["public_bathroom"], ["fire_station"], ["post_office"]];

const SPEED: Record<BackendTravelMode, number> = { WALK: 1.35, BICYCLE: 4.5, TWO_WHEELER: 8, DRIVE: 9, TRANSIT: 6 };

export function demoSegments(origin: LatLng, destination: LatLng, mode: BackendTravelMode): { routes: ApiRoute[] } {
  const direct = haversine(origin, destination);
  const bends = [0, 0.18, -0.26];
  const openBias = [0.62, 0.8, 0.45];
  const routes: ApiRoute[] = bends.map((bend, ri) => {
    const rand = rng(Math.round(origin.latitude * 1e4 + destination.longitude * 1e4) + ri * 97);
    const dx = destination.longitude - origin.longitude;
    const dy = destination.latitude - origin.latitude;
    const ctrl: LatLng = {
      latitude: origin.latitude + dy / 2 + dx * bend,
      longitude: origin.longitude + dx / 2 - dy * bend,
    };
    const steps = Math.max(8, Math.round((direct * (1 + Math.abs(bend))) / 100));
    const pts: LatLng[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const j = i === 0 || i === steps ? 0 : (rand() - 0.5) * 0.0004;
      pts.push({
        latitude: (1 - t) ** 2 * origin.latitude + 2 * (1 - t) * t * ctrl.latitude + t * t * destination.latitude + j,
        longitude: (1 - t) ** 2 * origin.longitude + 2 * (1 - t) * t * ctrl.longitude + t * t * destination.longitude + j,
      });
    }
    // a "quiet stretch" in the middle of some routes
    const quietStart = Math.floor(steps * (0.3 + rand() * 0.3));
    const segments: ApiSegment[] = [];
    for (let i = 0; i < steps; i++) {
      const a = pts[i]!, b = pts[i + 1]!;
      const len = haversine(a, b);
      const quiet = i >= quietStart && i < quietStart + Math.round(steps * 0.15) && ri !== 1;
      const count = quiet ? Math.floor(rand() * 2) : Math.floor(rand() * 5);
      const places: ApiPlace[] = [];
      for (let k = 0; k < count; k++) {
        const t = rand();
        const n = Math.floor(rand() * NAMES.length);
        const unknown = rand() < 0.12;
        places.push({
          id: `demo-${ri}-${i}-${k}`,
          name: NAMES[n]!,
          types: TYPES[n]!,
          latitude: a.latitude + (b.latitude - a.latitude) * t + (rand() - 0.5) * 0.00012,
          longitude: a.longitude + (b.longitude - a.longitude) * t + (rand() - 0.5) * 0.00012,
          openNow: unknown ? null : rand() < (quiet ? 0.25 : openBias[ri]!),
          businessStatus: "OPERATIONAL",
        });
      }
      const scored = places.filter((p) => typeof p.openNow === "boolean");
      const open = scored.filter((p) => p.openNow).length;
      segments.push({
        segmentNumber: i + 1,
        source: len > 150 ? "long-step-chunk" : "step",
        lengthMeters: Math.round(len),
        geometry: [a, b],
        places,
        placeCount: places.length,
        openPlaceCount: open,
        scoredPlaceCount: scored.length,
        safetyIndex: scored.length ? (open / scored.length) * 100 : null,
        safetyStatus: scored.length ? "available" : "insufficient-data",
      });
    }
    const valid = segments.filter((s) => s.safetyIndex != null && s.lengthMeters > 0);
    const totalLen = valid.reduce((s, x) => s + x.lengthMeters, 0);
    const idx = totalLen ? valid.reduce((s, x) => s + (x.safetyIndex as number) * x.lengthMeters, 0) / totalLen : null;
    const distance = segments.reduce((s, x) => s + x.lengthMeters, 0);
    return {
      routeNumber: ri + 1,
      distanceMeters: distance,
      duration: `${Math.round(distance / SPEED[mode])}s`,
      segments,
      safetyIndex: idx,
      safetyStatus: idx == null ? "insufficient-data" : "available",
      scoredSegmentCount: valid.length,
      scoredLengthMeters: totalLen,
    };
  });
  return { routes };
}

export function demoNearby(p: LatLng): NearbyResponse {
  const rand = rng(Math.round(p.latitude * 1e5));
  const places: ApiPlace[] = Array.from({ length: 14 }, (_, i) => {
    const n = Math.floor(rand() * NAMES.length);
    return {
      id: `near-${i}`,
      name: NAMES[n]!,
      types: TYPES[n]!,
      latitude: p.latitude + (rand() - 0.5) * 0.006,
      longitude: p.longitude + (rand() - 0.5) * 0.006,
      openNow: rand() < 0.15 ? null : rand() < 0.65,
      businessStatus: "OPERATIONAL",
    };
  });
  const scored = places.filter((x) => typeof x.openNow === "boolean");
  const open = scored.filter((x) => x.openNow).length;
  return {
    places,
    safetyIndex: scored.length ? (open / scored.length) * 100 : null,
    safetyStatus: scored.length ? "available" : "insufficient-data",
    openPlaceCount: open,
    scoredPlaceCount: scored.length,
  };
}
