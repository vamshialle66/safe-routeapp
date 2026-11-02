import inventory from "@/data/mumbai-streetlights.json";
import type { ApiRoute } from "./saferouteApi";
import { matchMappedLamps } from "./lightingEvidence";
import { assessRoute } from "./routeAssessment";

/** Offline, attributed Mumbai-only map inventory; no provider calls or safety bonus. */
export function attachMappedLighting(routes: ApiRoute[]): ApiRoute[] {
  return routes.map(route => ({ ...route, assessment: {
    ...(route.assessment ?? assessRoute(route)),
    lighting: matchMappedLamps(route, inventory.lamps, inventory.snapshotAt),
  } }));
}