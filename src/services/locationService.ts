import { SAFE_PLACES, SAVED_PLACES } from "@/data/mockData";
import type { SafePlace, SafePlaceType } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const SAFE_PLACE_LABELS: Record<SafePlaceType, string> = {
  police: "Police Station",
  hospital: "Hospital",
  pharmacy: "Pharmacy",
  public: "Public Place",
  transit: "Transit Station",
};

export const locationService = {
  async currentLocationLabel(): Promise<string> {
    await delay(200);
    return "Current Location";
  },

  async suggest(term: string): Promise<string[]> {
    await delay(150);
    const pool = [
      ...SAVED_PLACES.map((p) => p.address),
      "Harbour Square",
      "City Library Plaza",
      "Marlow Street Metro",
      "Northfield Bus Interchange",
      "Riverside Tech Park, Block C",
      "St. Marlow General Hospital",
    ];
    if (!term.trim()) return pool.slice(0, 5);
    return pool
      .filter((p) => p.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 6);
  },

  async nearbySafePlaces(type?: SafePlaceType): Promise<SafePlace[]> {
    await delay(250);
    const list = type ? SAFE_PLACES.filter((p) => p.type === type) : SAFE_PLACES;
    return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
  },

  savedPlaces() {
    return SAVED_PLACES;
  },
};
