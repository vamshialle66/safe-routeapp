import pointToLineDistance from "@turf/point-to-line-distance";
import { lineString, point } from "@turf/helpers";
import type { ApiRoute } from "./saferouteApi";

export interface MappedLamp {
  id: string;
  latitude: number;
  longitude: number;
  mappedAt: string;
}

export interface LightingEvidence {
  status: "mapped-locations" | "no-mapped-locations";
  nearbyLamps: MappedLamp[];
  snapshotAt: string;
  sourceUrl: string;
  // A mapped pole is not an inspection or a measurement of light on the road.
  score: null;
  adjustment: null;
}

export function matchMappedLamps(route: ApiRoute, lamps: MappedLamp[], snapshotAt: string): LightingEvidence {
  // Match each actual piece separately: joining disconnected geometry invents roads.
  const lines = route.segments.flatMap(s => {
    const coords = s.geometry.map(p => [p.longitude, p.latitude]);
    return coords.length >= 2 && coords.every(c => c.every(Number.isFinite)) ? [lineString(coords)] : [];
  });
  const unique = new Map<string, MappedLamp>();
  for (const lamp of lamps) {
    if (!Number.isFinite(lamp.latitude) || !Number.isFinite(lamp.longitude)) continue;
    if (lines.some(line => pointToLineDistance(point([lamp.longitude, lamp.latitude]), line, { units: "meters" }) <= 30)) {
      unique.set(lamp.id, lamp);
    }
  }
  const nearbyLamps = [...unique.values()];
  return { status: nearbyLamps.length ? "mapped-locations" : "no-mapped-locations", nearbyLamps, snapshotAt,
    sourceUrl: "https://www.openstreetmap.org/copyright", score: null, adjustment: null };
}