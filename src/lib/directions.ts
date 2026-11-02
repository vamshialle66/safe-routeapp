import { routeGeometry, type ApiRoute, type BackendTravelMode, type LatLng } from "./saferouteApi";

const MODE: Record<BackendTravelMode, string> = {
  DRIVE: "driving", TWO_WHEELER: "two-wheeler", BICYCLE: "bicycling", WALK: "walking", TRANSIT: "transit",
};

/** Google Maps directions link that follows the chosen route via up to 8 evenly spaced waypoints. */
export function googleDirectionsUrl(origin: LatLng, destination: LatLng, mode: BackendTravelMode, route?: ApiRoute): string {
  const f = (p: LatLng) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;
  const q = new URLSearchParams({ api: "1", origin: f(origin), destination: f(destination), travelmode: MODE[mode] });
  if (route && mode !== "TRANSIT") {
    const pts = routeGeometry(route);
    const n = 8;
    if (pts.length > n + 2) {
      const wps = Array.from({ length: n }, (_, i) => pts[Math.round(((i + 1) * (pts.length - 1)) / (n + 1))]!);
      q.set("waypoints", wps.map(f).join("|"));
    }
  }
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}
