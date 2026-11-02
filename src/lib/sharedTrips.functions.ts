import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

// Live trip sharing: the owner starts a trip from a real planned route and
// gets a share link. Anyone with the link can watch the live position until
// the owner marks arrival or ends the trip. No account needed to watch.

const startSchema = z.object({
  originLabel: z.string().min(1).max(300),
  destinationLabel: z.string().min(1).max(300),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  routePolyline: z.string().max(20000).nullable(),
  routeDistanceMeters: z.number().int().min(0).max(500000).nullable(),
  routeDurationSeconds: z.number().int().min(0).max(86400).nullable(),
});

function makeShareCode() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const startSharedTripFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => startSchema.parse(input))
  .handler(async ({ data, context }) => {
    // One active trip per person — end any previous ones.
    await context.supabase
      .from("shared_trips")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("status", "active");
    const { data: profile } = await context.supabase
      .from("profiles").select("display_name").eq("id", context.userId).maybeSingle();
    const email = typeof context.claims?.["email"] === "string" ? (context.claims["email"] as string) : "";
    const rawName = profile?.display_name?.trim() || email.split("@")[0] || "";
    const travelerName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1, 60) : null;
    const { data: trip, error } = await context.supabase
      .from("shared_trips")
      .insert({
        traveler_name: travelerName,
        share_code: makeShareCode(),
        user_id: context.userId,
        origin_label: data.originLabel,
        destination_label: data.destinationLabel,
        origin_lat: data.originLat,
        origin_lng: data.originLng,
        destination_lat: data.destinationLat,
        destination_lng: data.destinationLng,
        route_polyline: data.routePolyline,
        route_distance_meters: data.routeDistanceMeters,
        route_duration_seconds: data.routeDurationSeconds,
        status: "active",
      })
      .select("share_code")
      .single();
    if (error || !trip) throw new Error("The trip could not be started. Please try again.");
    return { shareCode: trip.share_code };
  });

export const updateSharedTripFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      shareCode: z.string().min(4).max(20),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("shared_trips")
      .update({ current_lat: data.lat, current_lng: data.lng, last_update_at: new Date().toISOString() })
      .eq("share_code", data.shareCode)
      .eq("user_id", context.userId)
      .eq("status", "active");
    if (error) throw new Error("Your position could not be shared.");
    return { ok: true };
  });

export const endSharedTripFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      shareCode: z.string().min(4).max(20),
      arrived: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("shared_trips")
      .update({ status: data.arrived ? "arrived" : "ended", ended_at: new Date().toISOString() })
      .eq("share_code", data.shareCode)
      .eq("user_id", context.userId)
      .eq("status", "active");
    if (error) throw new Error("The trip could not be ended.");
    return { ok: true };
  });

// Public read for watchers — no login required, publishable key, anon policy
// only exposes active trips. Ended trips stop being visible to watchers.
export const getSharedTripFn = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ shareCode: z.string().min(4).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const client = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: trip, error } = await client
      .from("shared_trips")
      .select(
        "share_code, traveler_name, origin_label, destination_label, origin_lat, origin_lng, destination_lat, destination_lng, route_polyline, route_distance_meters, route_duration_seconds, status, current_lat, current_lng, last_update_at, created_at",
      )
      .eq("share_code", data.shareCode)
      .maybeSingle();
    if (error) throw new Error("This trip could not be loaded.");
    if (!trip) {
      // Ended/arrived trips: tell watchers what happened, without any position.
      const { data: rows } = await client.rpc("get_shared_trip_outcome", { _share_code: data.shareCode });
      const o = Array.isArray(rows) ? rows[0] : null;
      return {
        found: false as const,
        outcome: o
          ? {
              status: o.status as "arrived" | "ended",
              travelerName: o.traveler_name,
              originLabel: o.origin_label,
              destinationLabel: o.destination_label,
              endedAt: o.ended_at,
            }
          : null,
      };
    }
    return {
      found: true as const,
      trip: {
        shareCode: trip.share_code,
        travelerName: trip.traveler_name,
        originLabel: trip.origin_label,
        destinationLabel: trip.destination_label,
        origin: { latitude: trip.origin_lat, longitude: trip.origin_lng },
        destination: { latitude: trip.destination_lat, longitude: trip.destination_lng },
        routePolyline: trip.route_polyline,
        routeDistanceMeters: trip.route_distance_meters,
        routeDurationSeconds: trip.route_duration_seconds,
        status: trip.status as "active" | "arrived" | "ended",
        current:
          trip.current_lat != null && trip.current_lng != null
            ? { latitude: trip.current_lat, longitude: trip.current_lng }
            : null,
        lastUpdateAt: trip.last_update_at,
        createdAt: trip.created_at,
      },
    };
  });
