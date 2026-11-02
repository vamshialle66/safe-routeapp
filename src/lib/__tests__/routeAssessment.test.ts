import { describe, expect, it } from "vitest";
import { assessRoute } from "../routeAssessment";
import { topRouteNumbers, type ApiRoute, type ApiPlace } from "../saferouteApi";

const place = (id: string, type = "store", openNow: boolean | null = true): ApiPlace => ({ id, name: id, types: [type], openNow, latitude: 0, longitude: 0 });
function route(places: ApiPlace[]): ApiRoute {
  return { routeNumber: 1, distanceMeters: 100, duration: "60s", safetyIndex: 100, safetyStatus: "available", scoredSegmentCount: 1, scoredLengthMeters: 100, segments: [{ segmentNumber: 1, source: "google", lengthMeters: 100, geometry: [{ latitude: 0, longitude: 0 }], places, placeCount: places.length, openPlaceCount: places.length, scoredPlaceCount: places.length, safetyIndex: 100, safetyStatus: "available" }] };
}
describe("expanded comparison", () => {
  it("five observed open places score higher than one, even with the same percentage open", () => {
    expect(assessRoute(route([place("one")])).score).toBe(20);
    expect(assessRoute(route(Array.from({ length: 5 }, (_, i) => place(String(i))))).score).toBe(100);
  });
  it("closed or unknown help never counts as confirmed open help", () => {
    const a = assessRoute(route([place("closed", "police", false), place("unknown", "hospital", null)]));
    expect(a.helpPlaces).toEqual([]);
    expect(a.help).toBeNull();
  });
  it("all unknown opening hours give no comparison score", () => {
    expect(assessRoute(route([place("unknown", "store", null)])).score).toBeNull();
  });
  it("less than half the journey checked suppresses the comparison score", () => {
    const r = route([place("shop")]);
    const first = r.segments[0];
    if (!first) throw new Error("Missing first test distance");
    r.segments.push({ ...first, segmentNumber: 2, lengthMeters: 300, geometry: [{ latitude: 1, longitude: 1 }], places: [] });
    expect(assessRoute(r).coverage).toBe(25);
    expect(assessRoute(r).score).toBeNull();
  });
  it("confirmed open police adds a help factor with explicit weights", () => {
    const a = assessRoute(route([place("police", "police")]));
    expect(a.help).toBe(100);
    expect(a.score).toBe(44);
  });
  it("selecting no activity categories gives no activity score", () => {
    expect(assessRoute(route([place("shop")]), undefined, new Set()).score).toBeNull();
  });
  it("expanded recommendations ignore higher legacy open-percent scores", () => {
    const a = route([place("one")]); a.assessment = assessRoute(a);
    const b = route(Array.from({ length: 5 }, (_, i) => place(String(i)))); b.routeNumber = 2; b.assessment = assessRoute(b);
    expect([...topRouteNumbers([a, b])]).toEqual([2]);
  });
});