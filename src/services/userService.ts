import {
  EMERGENCY_CONTACTS,
  MOCK_USER,
  NOTIFICATIONS,
  RECENT_TRIPS,
  SAVED_ROUTES,
} from "@/data/mockData";
import type {
  AppNotification,
  EmergencyContact,
  SavedRoute,
  Trip,
  UserProfile,
} from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Credentials {
  email: string;
  password: string;
}

export const authService = {
  async login(credentials: Credentials): Promise<UserProfile> {
    await delay(900);
    if (!credentials.email.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }
    return MOCK_USER;
  },
  async signup(name: string, email: string): Promise<UserProfile> {
    await delay(1100);
    return {
      ...MOCK_USER,
      name,
      email,
      initials: name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    };
  },
  async loginWithGoogle(): Promise<UserProfile> {
    await delay(900);
    return MOCK_USER;
  },
};

export const userService = {
  async profile(): Promise<UserProfile> {
    await delay(200);
    return MOCK_USER;
  },
  async savedRoutes(): Promise<SavedRoute[]> {
    await delay(400);
    return SAVED_ROUTES;
  },
  async trips(): Promise<Trip[]> {
    await delay(400);
    return RECENT_TRIPS;
  },
  async notifications(): Promise<AppNotification[]> {
    await delay(350);
    return NOTIFICATIONS;
  },
  async emergencyContacts(): Promise<EmergencyContact[]> {
    await delay(250);
    return EMERGENCY_CONTACTS;
  },
};
