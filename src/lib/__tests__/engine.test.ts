import { describe, expect, it } from "vitest";
import { placeIndex, routeIndex, splitLine } from "../engine.server";
import type { ApiSegment } from "../saferouteApi";

const P = (openNow: boolean | null) => ({ name: "x", latitude: 0, longitude: 0, openNow });

describe("safety index rules", () => {
  it("index is the share of scored places open right now", () => {
    expect(placeIndex([P(true), P(true), P(false), P(null)]).safetyIndex).toBeCloseTo(66.67, 1);
  });
  it("is null when no place has opening data", () => {
    expect(placeIndex([P(null)]).safetyIndex).toBeNull();
  });
  it("route index is length-weighted over scored segments", () => {
    const seg = (len: number, idx: number | null) => ({ lengthMeters: len, safetyIndex: idx }) as ApiSegment;
    expect(routeIndex([seg(100, 100), seg(300, 0), seg(500, null)]).safetyIndex).toBe(25);
  });
  it("splits lines into ~100 m pieces", () => {
    const line = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0.0045 }]; // ~500 m
    expect(splitLine(line).length).toBe(5);
  });
});

import { placeIndex as pi2 } from "../engine.server";
import { typesFor } from "../placeCategories";
describe("score categories", () => {
  it("only selected categories count toward the index", () => {
    const mk = (types: string[], openNow: boolean) => ({ id: types[0]!, name: "x", latitude: 0, longitude: 0, types, businessStatus: "OPERATIONAL", openNow });
    const places = [mk(["atm"], true), mk(["public_bathroom"], false), mk(["bar"], false)];
    const r = pi2(places, new Set(typesFor(["atm", "toilets"])));
    expect(r.scoredPlaceCount).toBe(2);
    expect(r.safetyIndex).toBe(50);
  });
});
