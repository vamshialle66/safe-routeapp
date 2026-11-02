import type { ApiPlace, ApiRoute, LatLng } from "./saferouteApi";
import type { CrimeEvidence } from "./crimeEvidence";
import type { LightingEvidence } from "./lightingEvidence";

export interface RouteAssessment {
  version: 1 | 2;
  crime?: CrimeEvidence;
  lighting?: LightingEvidence;
  score: number | null;
  activity: number | null;
  help: number | null;
  coverage: number;
  helpPlaces: ApiPlace[];
  nearestHelpMeters: number | null;
  reasons: string[];
}

const HELP_TYPES = new Set(["police", "fire_station", "hospital", "pharmacy", "drugstore"]);
function meters(a: LatLng, b: LatLng) {
  const rad = Math.PI / 180;
  const x = (a.longitude - b.longitude) * rad * Math.cos((a.latitude + b.latitude) / 2 * rad);
  const y = (a.latitude - b.latitude) * rad;
  return Math.hypot(x, y) * 6371000;
}

/** Experimental comparison only: observed open-place density and observed open help nearby.
 * Missing help is unknown, never proof of no help. Low coverage cannot earn a recommendation.
 * No extra provider calls; no crime, lighting or crowd proxies.
 */
export function assessRoute(route: ApiRoute, observedPlaces?: ApiPlace[], selectedTypes?: Set<string>): RouteAssessment {
  const unique = new Map<string, ApiPlace>();
  (observedPlaces ?? route.segments.flatMap(s => s.places)).forEach(p => unique.set(p.id ?? `${p.name}:${p.latitude}:${p.longitude}`, p));
  const places = [...unique.values()];
  const helpPlaces = places.filter(p => p.openNow === true && p.types?.some(t => HELP_TYPES.has(t)));
  const total = route.segments.reduce((a, s) => a + s.lengthMeters, 0);
  let activityTotal = 0, activityLength = 0, helpTotal = 0, helpLength = 0;
  let nearestHelpMeters: number | null = null;
  for (const s of route.segments) {
    const center = s.geometry[Math.floor(s.geometry.length / 2)];
    if (!center) continue;
    const nearby = places.filter(p => meters(p, center) <= 250 && (!selectedTypes || p.types?.some(t => selectedTypes.has(t))));
    const known = nearby.filter(p => typeof p.openNow === "boolean");
    if (known.length) {
      // Saturates at five observed open places within 250 m. Density, not crowd measurement.
      activityTotal += Math.min(1, known.filter(p => p.openNow).length / 5) * 100 * s.lengthMeters;
      activityLength += s.lengthMeters;
    }
    const distances = helpPlaces.map(p => meters(p, center)).filter(d => d <= 250);
    if (distances.length) {
      const nearest = Math.min(...distances);
      nearestHelpMeters = Math.min(nearestHelpMeters ?? nearest, nearest);
      helpTotal += (1 - nearest / 500) * 100 * s.lengthMeters;
      helpLength += s.lengthMeters;
    }
  }
  const coverage = total ? Math.min(100, activityLength / total * 100) : 0;
  const activity = activityLength ? activityTotal / activityLength : null;
  // Positive observed evidence only; no result cannot be interpreted as an absence of help.
  const help = helpLength ? helpTotal / total : null;
  const score = activity != null && coverage >= 50 ? Math.round(help == null ? activity : activity * 0.7 + help * 0.3) : null;
  const reasons = [
    activity == null ? "Nearby opening hours are unavailable." : `Observed open-place density: ${Math.round(activity)} out of 100.`,
    helpPlaces.length ? `${helpPlaces.length} open help location${helpPlaces.length === 1 ? "" : "s"} found near sampled points.` : "No open help location was returned by this search; others may exist.",
    `Opening-hour information near ${Math.round(coverage)}% of this journey.`,
  ];
  return { version: 1, score, activity, help, coverage, helpPlaces, nearestHelpMeters, reasons };
}

/** Never mix legacy open-percentage rankings and expanded rankings in a single comparison. */
export function routeComparisonValue(route: ApiRoute) {
  return route.assessment ? route.assessment.score : route.safetyIndex;
}