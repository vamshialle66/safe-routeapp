export type RiskLevel = "low" | "moderate" | "high";

export type TravelMode = "driving" | "walking" | "cycling";

export type RoutePriority = "safest" | "balanced" | "fastest";

export interface SafetyFactors {
  lighting: number;
  publicActivity: number;
  crimeRisk: number;
  roadConditions: number;
  safeLocations: number;
}

export interface RouteSegment {
  id: string;
  label: string;
  risk: RiskLevel;
  distanceKm: number;
  note: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface RouteOption {
  id: string;
  name: string;
  kind: RoutePriority;
  safetyScore: number;
  scoreLabel: string;
  distanceKm: number;
  durationMin: number;
  risk: RiskLevel;
  tags: string[];
  factors: SafetyFactors;
  segments: RouteSegment[];
  reasons: string[];
  riskSegmentCount: number;
  recommended: boolean;
  /** Normalized 0-100 coordinates used by the mock map renderer. */
  path: Point[];
}

export interface RouteQuery {
  from: string;
  to: string;
  mode: TravelMode;
  priority: RoutePriority;
  preferences: RoutePreferences;
}

export interface RoutePreferences {
  wellLit: boolean;
  populated: boolean;
  avoidHighRisk: boolean;
  avoidIsolated: boolean;
}

export type SafePlaceType =
  | "police"
  | "hospital"
  | "pharmacy"
  | "public"
  | "transit";

export interface SafePlace {
  id: string;
  name: string;
  type: SafePlaceType;
  distanceKm: number;
  open24h: boolean;
  position: Point;
}

export interface SavedRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  safetyScore: number;
  distanceKm: number;
  durationMin: number;
  savedAt: string;
  risk: RiskLevel;
}

export interface Trip {
  id: string;
  date: string;
  from: string;
  to: string;
  routeName: string;
  safetyScore: number;
  distanceKm: number;
  durationMin: number;
  risk: RiskLevel;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "route" | "safety" | "location" | "account";
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  travelMode: TravelMode;
  safetyPreference: RoutePriority;
  initials: string;
}
