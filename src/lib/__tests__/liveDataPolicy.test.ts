import { describe, expect, it } from "vitest";
import { requireLiveData } from "../liveDataPolicy";

describe("real searches", () => {
  it("does not substitute sample routes when live data is unavailable", () => {
    expect(() => requireLiveData({ ok: false, reason: "Search unavailable" })).toThrow("Search unavailable");
  });
  it("preserves a successful empty search instead of inventing nearby places", () => {
    expect(requireLiveData({ ok: true, data: { places: [] } })).toEqual({ places: [] });
  });
});