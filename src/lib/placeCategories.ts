/** Place categories the user can include/exclude from safety scores. Browser + server safe. */
export interface PlaceCategory { id: string; label: string; hint: string; types: string[] }

export const PLACE_CATEGORIES: PlaceCategory[] = [
  { id: "shops", label: "Shops", hint: "Convenience, grocery, malls, stores", types: ["convenience_store", "supermarket", "grocery_store", "store", "department_store", "shopping_mall", "clothing_store", "electronics_store", "hardware_store", "liquor_store", "book_store"] },
  { id: "food", label: "Food & cafés", hint: "Restaurants, cafés, bakeries", types: ["restaurant", "cafe", "fast_food_restaurant", "bakery", "meal_takeaway"] },
  { id: "bars", label: "Bars", hint: "Pubs and bars", types: ["bar"] },
  { id: "medical", label: "Pharmacies & hospitals", hint: "Chemists, drugstores, hospitals", types: ["pharmacy", "drugstore", "hospital"] },
  { id: "police", label: "Police & fire stations", hint: "Emergency services", types: ["police", "fire_station"] },
  { id: "atm", label: "ATMs & banks", hint: "Cash machines and bank branches", types: ["atm", "bank"] },
  { id: "toilets", label: "Public toilets", hint: "Public restrooms", types: ["public_bathroom"] },
  { id: "fuel", label: "Fuel stations", hint: "Petrol pumps", types: ["gas_station"] },
  { id: "hotels", label: "Hotels", hint: "Hotels and lodgings", types: ["hotel", "lodging"] },
  { id: "transit", label: "Transit stations", hint: "Bus, train, metro", types: ["bus_station", "train_station", "subway_station", "transit_station"] },
  { id: "post", label: "Post offices", hint: "Post offices", types: ["post_office"] },
];

export const ALL_CATEGORY_IDS = PLACE_CATEGORIES.map((c) => c.id);

/** Google place types that count, given selected category ids. */
export function typesFor(ids: string[]): string[] {
  return PLACE_CATEGORIES.filter((c) => ids.includes(c.id)).flatMap((c) => c.types);
}

/** Whether a place counts toward the score for these allowed types (undefined = all count). */
export function placeCounts(placeTypes: string[] | undefined, allowed?: Set<string>): boolean {
  if (!allowed) return true;
  return (placeTypes ?? []).some((t) => allowed.has(t));
}

const KEY = "saferoute.categories";
export function getScoreCategories(): string[] {
  if (typeof window === "undefined") return ALL_CATEGORY_IDS;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return Array.isArray(v) ? v.filter((x) => ALL_CATEGORY_IDS.includes(x)) : ALL_CATEGORY_IDS;
  } catch { return ALL_CATEGORY_IDS; }
}
export function setScoreCategories(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}
