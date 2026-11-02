import { z } from "zod";

export const ALERT_CATEGORIES = {
  lighting: "Poor lighting",
  harassment: "Harassment or unwanted attention",
  obstruction: "Blocked or damaged path",
  suspicious_activity: "Concerning behaviour",
  other: "Other concern",
} as const;
export const ALERT_URGENCY = { informational: "For awareness", caution: "Use caution", urgent: "May need immediate help" } as const;
export const classificationSchema = z.object({
  category: z.enum(["lighting", "harassment", "obstruction", "suspicious_activity", "other"]),
  urgency: z.enum(["informational", "caution", "urgent"]),
  summary: z.string(),
}).strict();
export const concernSchema = z.object({
  journeyId: z.string().min(1).max(100),
  routeLabel: z.string().min(1).max(250),
  locationLabel: z.string().trim().min(3).max(250),
  concern: z.string().trim().min(20, "Please describe what happened in at least 20 characters.").max(2000),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export const reviewSchema = classificationSchema.extend({ id: z.string().uuid(), summary: z.string().trim().min(10).max(500) });
export function unverifiedDraft(input: z.infer<typeof classificationSchema>) {
  return { ...input, summary: input.summary.trim().slice(0, 500), status: "draft" as const, verification: "unverified" as const };
}

import type { LatLng } from "./saferouteApi";

/** Corridor padding around a route for matching tips, in degrees (~400 m). */
export const TIP_CORRIDOR_PAD_DEG = 0.004;

/**
 * Padded bounding box around a route's path. Only tips pinned inside this box
 * count as "along this route" — tips pinned elsewhere never appear on it.
 */
export function routeBoundingBox(points: LatLng[], pad: number = TIP_CORRIDOR_PAD_DEG) {
  if (!points.length) return null;
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) continue;
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }
  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) return null;
  return { minLat: minLat - pad, minLng: minLng - pad, maxLat: maxLat + pad, maxLng: maxLng + pad };
}