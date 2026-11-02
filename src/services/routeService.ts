import { MOCK_ROUTES, getRouteById } from "@/data/mockRoutes";
import type { RouteOption, RouteQuery } from "@/types";

/**
 * Route service.
 * Swap the mock implementations for real HTTP calls (Google Directions +
 * SafeRoute scoring API) without touching any UI component.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function orderForPriority(routes: RouteOption[], query: RouteQuery) {
  const copy = routes.map((r) => ({ ...r }));
  if (query.priority === "fastest") {
    return copy.sort((a, b) => a.durationMin - b.durationMin);
  }
  if (query.priority === "balanced") {
    return copy.sort(
      (a, b) =>
        b.safetyScore / b.durationMin - a.safetyScore / a.durationMin,
    );
  }
  return copy.sort((a, b) => b.safetyScore - a.safetyScore);
}

export const routeService = {
  async findRoutes(query: RouteQuery): Promise<RouteOption[]> {
    await delay(1400);
    if (!query.from.trim() || !query.to.trim()) {
      throw new Error("Both a starting point and a destination are required.");
    }
    return orderForPriority(MOCK_ROUTES, query);
  },

  async getRoute(id: string): Promise<RouteOption> {
    await delay(300);
    const route = getRouteById(id);
    if (!route) throw new Error(`Route "${id}" was not found.`);
    return route;
  },

  async listRoutes(): Promise<RouteOption[]> {
    await delay(250);
    return MOCK_ROUTES;
  },
};
