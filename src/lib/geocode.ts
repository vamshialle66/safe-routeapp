import type { NamedPoint } from "./analysisStore";

/** Free-text place search (OpenStreetMap Nominatim). Also accepts "lat, lng". */
export async function searchPlaces(q: string): Promise<NamedPoint[]> {
  const term = q.trim();
  if (term.length < 3) return [];
  const coord = term.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coord) {
    const latitude = parseFloat(coord[1]!);
    const longitude = parseFloat(coord[2]!);
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180)
      return [{ label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, latitude, longitude }];
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(term)}`,
      { headers: { Accept: "application/json" } },
    );
    const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    return data.map((d) => ({ label: d.display_name, latitude: parseFloat(d.lat), longitude: parseFloat(d.lon) }));
  } catch {
    return [];
  }
}

export function currentPosition(): Promise<NamedPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location isn't available in this browser."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ label: "My current location", latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => reject(new Error("We couldn't get your location. Please allow location access.")),
      { maximumAge: 0, timeout: 8000 },
    );
  });
}

export const SAMPLE_ORIGIN: NamedPoint = { label: "Kurla West, Mumbai", latitude: 19.076, longitude: 72.8777 };
export const SAMPLE_DESTINATION: NamedPoint = { label: "Dadar, Mumbai", latitude: 19.0178, longitude: 72.8478 };
