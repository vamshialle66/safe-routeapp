import { describe, expect, it } from "vitest";
import { matchMappedLamps, type MappedLamp } from "../lightingEvidence";
import { attachMappedLighting } from "../lightingEvidence.server";
import type { ApiRoute } from "../saferouteApi";

const route: ApiRoute = {
  routeNumber: 1, distanceMeters: 2100, duration: "1800s", safetyIndex: 59,
  safetyStatus: "available", scoredSegmentCount: 1, scoredLengthMeters: 2100,
  segments: [{ segmentNumber: 1, source: "test", lengthMeters: 2100,
    geometry: [{ latitude: 19.05, longitude: 72.84 }, { latitude: 19.05, longitude: 72.86 }],
    places: [], placeCount: 0, openPlaceCount: 0, scoredPlaceCount: 0, safetyIndex: null, safetyStatus: "insufficient-data" }],
  assessment: { version: 1, score: 59, activity: 59, help: null, coverage: 100, helpPlaces: [], nearestHelpMeters: null, reasons: [] },
};
const lamp: MappedLamp = { id: "test-only", latitude: 19.05, longitude: 72.85, mappedAt: "2020-01-01T00:00:00Z" };
const match = (r: ApiRoute, lamps: MappedLamp[]) => matchMappedLamps(r, lamps, "2026-07-15T15:22:01Z");

describe("mapped streetlights are context, not verified illumination", () => {
  it("never gives mapped poles a lighting score or a safety adjustment", () => {
    const evidence = match(route, [lamp]);
    expect(evidence.nearbyLamps).toEqual([lamp]);
    expect(evidence.score).toBeNull();
    expect(evidence.adjustment).toBeNull();
    expect(attachMappedLighting([route])[0]?.assessment?.score).toBe(59);
  });
  it("missing mapped lamps does not mean a road is dark", () => {
    const evidence = match(route, []);
    expect(evidence.status).toBe("no-mapped-locations");
    expect(evidence.score).toBeNull();
  });
  it("excludes lamps beyond the 30 metre location corridor", () => {
    expect(match(route, [{ ...lamp, latitude: 19.0502 }]).nearbyLamps).toHaveLength(1);
    expect(match(route, [{ ...lamp, latitude: 19.0504 }]).nearbyLamps).toHaveLength(0);
  });
  it("does not invent a road between disconnected pieces", () => {
    const r = { ...route, segments: [
      { ...route.segments[0], geometry: [{ latitude: 19.05, longitude: 72.8 }, { latitude: 19.05, longitude: 72.81 }] },
      { ...route.segments[0], geometry: [{ latitude: 19.05, longitude: 72.89 }, { latitude: 19.05, longitude: 72.9 }] },
    ] } as ApiRoute;
    expect(match(r, [lamp]).nearbyLamps).toHaveLength(0);
  });
  it("deduplicates mapped asset IDs and safely handles empty routes", () => {
    expect(match(route, [lamp, lamp]).nearbyLamps).toHaveLength(1);
    expect(match({ ...route, segments: [] }, [lamp]).nearbyLamps).toHaveLength(0);
  });
});