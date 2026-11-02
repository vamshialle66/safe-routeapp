import type {
  AppNotification,
  EmergencyContact,
  SafePlace,
  SavedRoute,
  Trip,
  UserProfile,
} from "@/types";

export const MOCK_USER: UserProfile = {
  name: "Aarya Menon",
  email: "aarya.menon@example.com",
  phone: "+91 98200 41xxx",
  travelMode: "driving",
  safetyPreference: "safest",
  initials: "AM",
};

export const SAVED_PLACES = [
  { id: "home", label: "Home", address: "14 Elmgrove Terrace" },
  { id: "college", label: "College", address: "Northfield Campus, Gate 2" },
  { id: "work", label: "Work", address: "Riverside Tech Park, Block C" },
  { id: "other", label: "Studio", address: "Marlow Street 42" },
];

export const SAFE_PLACES: SafePlace[] = [
  { id: "sp1", name: "Central District Police Station", type: "police", distanceKm: 0.6, open24h: true, position: { x: 30, y: 58 } },
  { id: "sp2", name: "Northfield Police Outpost", type: "police", distanceKm: 1.9, open24h: true, position: { x: 68, y: 26 } },
  { id: "sp3", name: "St. Marlow General Hospital", type: "hospital", distanceKm: 1.2, open24h: true, position: { x: 56, y: 40 } },
  { id: "sp4", name: "Riverside Emergency Clinic", type: "hospital", distanceKm: 2.4, open24h: true, position: { x: 44, y: 68 } },
  { id: "sp5", name: "Greenleaf 24h Pharmacy", type: "pharmacy", distanceKm: 0.4, open24h: true, position: { x: 24, y: 70 } },
  { id: "sp6", name: "Kensington Night Pharmacy", type: "pharmacy", distanceKm: 1.5, open24h: true, position: { x: 40, y: 48 } },
  { id: "sp7", name: "Harbour Square", type: "public", distanceKm: 0.9, open24h: false, position: { x: 62, y: 60 } },
  { id: "sp8", name: "City Library Plaza", type: "public", distanceKm: 1.7, open24h: false, position: { x: 74, y: 44 } },
  { id: "sp9", name: "Marlow Street Metro", type: "transit", distanceKm: 0.5, open24h: false, position: { x: 50, y: 30 } },
  { id: "sp10", name: "Northfield Bus Interchange", type: "transit", distanceKm: 2.1, open24h: false, position: { x: 82, y: 24 } },
];

export const SAVED_ROUTES: SavedRoute[] = [
  { id: "sr1", name: "Evening commute home", from: "Riverside Tech Park", to: "14 Elmgrove Terrace", safetyScore: 92, distanceKm: 6.2, durationMin: 24, savedAt: "2026-08-18", risk: "low" },
  { id: "sr2", name: "Campus to studio", from: "Northfield Campus", to: "Marlow Street 42", safetyScore: 84, distanceKm: 3.8, durationMin: 15, savedAt: "2026-08-12", risk: "low" },
  { id: "sr3", name: "Late library run", from: "14 Elmgrove Terrace", to: "City Library Plaza", safetyScore: 71, distanceKm: 2.6, durationMin: 11, savedAt: "2026-08-04", risk: "moderate" },
];

export const RECENT_TRIPS: Trip[] = [
  { id: "t1", date: "2026-08-23 21:40", from: "Riverside Tech Park", to: "14 Elmgrove Terrace", routeName: "Safest Route", safetyScore: 92, distanceKm: 6.2, durationMin: 24, risk: "low" },
  { id: "t2", date: "2026-08-22 19:05", from: "Northfield Campus", to: "Harbour Square", routeName: "Balanced Route", safetyScore: 78, distanceKm: 4.1, durationMin: 16, risk: "moderate" },
  { id: "t3", date: "2026-08-21 08:15", from: "14 Elmgrove Terrace", to: "Northfield Campus", routeName: "Safest Route", safetyScore: 95, distanceKm: 5.0, durationMin: 18, risk: "low" },
  { id: "t4", date: "2026-08-19 22:30", from: "Marlow Street 42", to: "14 Elmgrove Terrace", routeName: "Balanced Route", safetyScore: 74, distanceKm: 3.3, durationMin: 13, risk: "moderate" },
  { id: "t5", date: "2026-08-17 20:10", from: "Harbour Square", to: "Riverside Tech Park", routeName: "Safest Route", safetyScore: 88, distanceKm: 4.7, durationMin: 19, risk: "low" },
];

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: "ec1", name: "Priya Menon", relation: "Sister", phone: "+91 98111 22xxx" },
  { id: "ec2", name: "Rahul Iyer", relation: "Flatmate", phone: "+91 98444 87xxx" },
  { id: "ec3", name: "Campus Security Desk", relation: "Institution", phone: "+91 22 4455 xxxx" },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "Your saved route is ready", body: "Evening commute home has been re-analyzed with tonight's conditions.", time: "12 min ago", read: false, kind: "route" },
  { id: "n2", title: "Safety information has been updated", body: "Lighting data refreshed for the Riverbank Crossing corridor.", time: "1 hr ago", read: false, kind: "safety" },
  { id: "n3", title: "Location sharing is currently enabled", body: "You are sharing live location with Priya Menon until 23:00.", time: "2 hrs ago", read: false, kind: "location" },
  { id: "n4", title: "Route comparison saved", body: "Three routes to Elmgrove Terrace were compared and archived.", time: "Yesterday", read: true, kind: "route" },
  { id: "n5", title: "Emergency contact added", body: "Campus Security Desk was added to your emergency contacts.", time: "3 days ago", read: true, kind: "account" },
];

export const DASHBOARD_STATS = [
  { id: "planned", label: "Routes Planned", value: "128", hint: "Last 90 days" },
  { id: "safe", label: "Safe Routes Chosen", value: "104", hint: "81% of journeys" },
  { id: "avg", label: "Average Safety Score", value: "87", hint: "out of 100" },
  { id: "places", label: "Saved Places", value: "4", hint: "Home, College, Work, Studio" },
];

export const SAFETY_FACTOR_INFO = [
  { id: "lighting", title: "Lighting", description: "Street lighting density and continuity along each segment." },
  { id: "crime", title: "Crime / Risk Level", description: "Comparative risk indication for the area a segment passes through." },
  { id: "activity", title: "Public Activity", description: "Expected pedestrian and vehicle presence at your travel time." },
  { id: "road", title: "Road / Area Conditions", description: "Surface quality, sightlines, footpaths and crossing safety." },
  { id: "places", title: "Safe Locations", description: "Proximity to police stations, hospitals, pharmacies and transit." },
  { id: "segments", title: "Risk-Prone Segments", description: "Isolated stretches, underpasses and unlit corridors on the route." },
];

export const DISCLAIMER =
  "Safety scores are intended to provide a comparative indication between available routes based on the safety factors available to the system. All values shown are sample/mock data until real safety data sources are connected.";
