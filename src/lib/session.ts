import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  display_name: string | null;
  phone: string | null;
}

interface State {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
}

let state: State = { ready: false, user: null, profile: null };
const listeners = new Set<() => void>();
const SERVER: State = { ready: false, user: null, profile: null };

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSession() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

export function setSessionUser(user: User | null) {
  set({ ready: true, user, profile: user ? state.profile : null });
  if (user) void loadProfile(user.id);
}

async function loadProfile(id: string) {
  const { data } = await supabase.from("profiles").select("id, display_name, phone").eq("id", id).maybeSingle();
  if (state.user?.id === id) set({ profile: data ?? { id, display_name: null, phone: null } });
}

export async function updateProfile(patch: { display_name: string; phone: string }) {
  const id = state.user?.id;
  if (!id) throw new Error("Please sign in first.");
  const { error } = await supabase.from("profiles").upsert({ id, ...patch, updated_at: new Date().toISOString() });
  if (error) throw error;
  set({ profile: { id, ...patch } });
}

export function displayName(s: State): string {
  return (
    s.profile?.display_name ||
    (s.user?.user_metadata?.["full_name"] as string | undefined) ||
    s.user?.email?.split("@")[0] ||
    "there"
  );
}

export function initials(name: string) {
  return name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "SR";
}
