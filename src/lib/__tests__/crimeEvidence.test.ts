import { describe, expect, it } from "vitest";
import { crimeEvidence, policeDatasetSchema, policeRecordSchema, type PoliceDataset, type PoliceRecord } from "../crimeEvidence";
import type { ApiRoute } from "../saferouteApi";
const now = new Date("2026-10-16T07:15:00Z");
const dataset: PoliceDataset = { id: "d", source_url: "https://mumbaipolice.gov.in/report.pdf", title: "Test fixture only", content_sha256: "a".repeat(64), period_start: "2026-09-01", period_end: "2026-09-30", reviewed_at: now.toISOString(), methodology: "Test fixture, not actual police data", completeness: "complete", coverage_geojson: { type: "Polygon", coordinates: [[[72.8,19],[72.9,19],[72.9,19.1],[72.8,19.1],[72.8,19]]] } };
const route = { segments: [{ geometry: [{ latitude: 19.05, longitude: 72.84 }, { latitude: 19.05, longitude: 72.86 }] }] } as ApiRoute;
const report: PoliceRecord = { dataset_id: "d", source_record_id: "test-only", category: "violence", occurred_on: "2026-09-15", location_precision: "street", latitude: 19.05, longitude: 72.85, incident_count: 1, location_label: "Test only", source_locator: "Test page" };
describe("source-linked Mumbai crime evidence", () => {
  it("never substitutes station totals for street incidents", () => {
    expect(crimeEvidence(route, [dataset], [{ ...report, location_precision: "police_station", incident_count: 100 }], now).nearbyIncidents).toBe(0);
  });
  it("partial police reports cannot change a score", () => {
    const a = crimeEvidence(route, [{ ...dataset, completeness: "partial" }], [report], now);
    expect(a.status).toBe("partial"); expect(a.adjustment).toBeNull();
  });
  it("verified complete recent coverage permits an explicit capped adjustment", () => {
    expect(crimeEvidence(route, [dataset], [report], now).adjustment).toBe(2);
    expect(crimeEvidence(route, [dataset], [{ ...report, incident_count: 20 }], now).adjustment).toBe(20);
  });
  it("zero reported incidents gives no positive safety bonus", () => {
    expect(crimeEvidence(route, [dataset], [], now).adjustment).toBe(0);
  });
  it("records beyond 250 metres never count", () => {
    expect(crimeEvidence(route, [dataset], [{ ...report, latitude: 19.06 }], now).nearbyIncidents).toBe(0);
  });
  it("stale coverage cannot influence scores", () => {
    expect(crimeEvidence(route, [{ ...dataset, period_start: "2025-01-01", period_end: "2025-01-31" }], [report], now).adjustment).toBeNull();
  });
  it("routes leaving the reporting boundary cannot be scored against it", () => {
    const first = route.segments[0];
    if (!first) throw new Error("Missing test route geometry");
    const outside = { ...route, segments: [{ ...first, geometry: [{ latitude: 19.05, longitude: 72.85 }, { latitude: 19.2, longitude: 72.85 }] }] };
    expect(crimeEvidence(outside, [dataset], [report], now).adjustment).toBeNull();
  });
  it("deduplicates the same official record", () => {
    expect(crimeEvidence(route, [dataset], [report, report], now).nearbyIncidents).toBe(1);
  });
  it("future incidents do not influence evidence", () => {
    expect(crimeEvidence(route, [dataset], [{ ...report, occurred_on: "2026-11-01" }], now).nearbyIncidents).toBe(0);
  });
  it("requires verified street coordinates and official source links", () => {
    expect(policeRecordSchema.safeParse({ ...report, latitude: null, longitude: null }).success).toBe(false);
    expect(policeDatasetSchema.safeParse({ ...dataset, source_url: "https://example.com/report.pdf" }).success).toBe(false);
    expect(policeDatasetSchema.safeParse({ ...dataset, coverage_geojson: null }).success).toBe(false);
    expect(policeDatasetSchema.safeParse({ ...dataset, reviewed_at: "2026-10-16T07:18:00+00:00" }).success).toBe(true);
  });
});