import { describe, expect, it } from "vitest";
import { concernSchema, classificationSchema, unverifiedDraft, reviewSchema, routeBoundingBox, TIP_CORRIDOR_PAD_DEG } from "../communityAlerts";
describe("Community concern review", () => {
  it("accepts natural language concerns without a predefined selection", () => {
    expect(concernSchema.parse({ journeyId: "trip-1", routeLabel: "Route 1", locationLabel: "Station entrance", concern: "The footpath near the station was very dark tonight." }).concern).toContain("dark");
  });
  it("AI classification always starts unverified for review", () => {
    const draft = unverifiedDraft(classificationSchema.parse({ category: "lighting", urgency: "caution", summary: "Poor lighting reported near the station." }));
    expect(draft.status).toBe("draft"); expect(draft.verification).toBe("unverified"); expect(draft).not.toHaveProperty("score");
  });
  it("rejects AI claims of verification or extra classification fields", () => {
    expect(classificationSchema.safeParse({ category: "lighting", urgency: "caution", summary: "Poor lighting reported.", verification: "verified" }).success).toBe(false);
  });
  it("lets the reporter correct classification before review", () => {
    const edited = reviewSchema.parse({ id: "12345678-1234-4234-8234-123456789012", category: "obstruction", urgency: "informational", summary: "A damaged path was reported near the station." });
    expect(edited.category).toBe("obstruction"); expect(edited.urgency).toBe("informational");
  });
});