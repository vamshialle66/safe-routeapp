import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { concernSchema, reviewSchema, unverifiedDraft } from "./communityAlerts";
import { classifyConcern, AlertAIError, ALERT_MODEL } from "./communityAlerts.server";

export const classifyAlertFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => concernSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Privileged access is limited to the durable provider circuit breaker, after authentication.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const block = await supabaseAdmin.from("ai_feature_state").select("safe_message").eq("feature", "community-alerts").maybeSingle();
    if (block.error) return { alert: null, error: "AI availability could not be checked. Please try again later." };
    if (block.data) return { alert: null, error: block.data.safe_message };
    try {
      const classification = unverifiedDraft(await classifyConcern(data.concern));
      const { data: alert, error } = await context.supabase.from("community_alerts").insert({
        ...classification, user_id: context.userId, journey_id: data.journeyId,
        route_label: data.routeLabel, location_label: data.locationLabel, concern: data.concern, model: ALERT_MODEL,
        ...(data.latitude != null && data.longitude != null ? { latitude: data.latitude, longitude: data.longitude } : {}),
      }).select().single();
      if (error) return { alert: null, error: "The draft could not be saved. Your original description is still here." };
      return { alert, error: null };
    } catch (error) {
      const message = error instanceof AlertAIError ? error.message : "AI classification is unavailable. Nothing was published.";
      if (error instanceof AlertAIError && error.blocked) {
        const { error: persistError } = await supabaseAdmin.from("ai_feature_state").upsert({ feature: "community-alerts", safe_message: message });
        if (persistError) console.error("Unable to persist AI feature block", persistError.code);
      }
      return { alert: null, error: message };
    }
  });

export const listAlertsFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ journeyId: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.from("community_alerts").select().eq("user_id", context.userId).eq("journey_id", data.journeyId).order("created_at", { ascending: false }).limit(20);
    if (result.error) throw new Error("Your saved alerts could not be loaded.");
    return result.data;
  });

export const reviewAlertFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => reviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const result = await context.supabase.from("community_alerts").update({ ...patch, status: "pending_review", reviewed_at: new Date().toISOString() }).eq("id", id).eq("user_id", context.userId).select().single();
    if (result.error) throw new Error("Your review could not be saved. Please try again.");
    return result.data;
  });

export const deleteAlertFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.from("community_alerts").delete().eq("id", data.id).eq("user_id", context.userId);
    if (result.error) throw new Error("Your alert could not be deleted.");
    return { ok: true };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isReviewer(supabase: any, userId: string) {
  const [admin, moderator] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "moderator" }),
  ]);
  return !!admin.data || !!moderator.data;
}

// Lightweight check so the navigation only shows reviewer tools to people
// who actually have access. Server-side checks still guard every action.
export const myReviewerStatusFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ reviewer: await isReviewer(context.supabase, context.userId) }));

export const reviewQueueFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isReviewer(context.supabase, context.userId))) return { allowed: false as const, alerts: [] };
    const result = await context.supabase.from("community_alerts")
      .select("id, category, urgency, summary, concern, location_label, status, created_at, moderated_at, moderator_note")
      .neq("status", "draft").order("created_at", { ascending: false }).limit(100);
    if (result.error) throw new Error("Reports waiting for review could not be loaded.");
    return { allowed: true as const, alerts: result.data };
  });

export const moderateAlertFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(500).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("moderate_alert", { _id: data.id, _decision: data.decision, ...(data.note ? { _note: data.note } : {}) });
    if (error) throw new Error("This decision could not be saved. You may not have reviewer access.");
    return { ok: true };
  });

// Tips along a route: when a route bounding box is given, only approved tips
// pinned inside it are returned; otherwise the latest approved tips are.
export const communityTipsFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({
    minLat: z.number().optional(), minLng: z.number().optional(),
    maxLat: z.number().optional(), maxLng: z.number().optional(),
  }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("list_community_tips", {
      _limit: 10,
      _min_lat: data.minLat ?? null, _min_lng: data.minLng ?? null,
      _max_lat: data.maxLat ?? null, _max_lng: data.maxLng ?? null,
    });
    if (result.error) throw new Error("Community tips could not be loaded.");
    return result.data ?? [];
  });

// Areas with the most approved reports — counts only, never reporter details.
export const areaReportsFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("area_report_counts", { _limit: 8 });
    if (error) throw new Error("Reported areas could not be loaded.");
    return data ?? [];
  });

// Admin-only: manage who can review community reports. Role checks happen
// inside the security-definer database functions, never in the browser.
export const adminOverviewFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { allowed: false as const, reviewers: [], counts: { waiting: 0, approved: 0, rejected: 0 } };
    const [reviewers, alerts] = await Promise.all([
      context.supabase.rpc("list_reviewers"),
      context.supabase.from("community_alerts").select("status").neq("status", "draft"),
    ]);
    if (reviewers.error || alerts.error) throw new Error("Admin details could not be loaded.");
    const rows = alerts.data ?? [];
    return {
      allowed: true as const,
      reviewers: reviewers.data ?? [],
      counts: {
        waiting: rows.filter(r => r.status === "pending_review").length,
        approved: rows.filter(r => r.status === "approved").length,
        rejected: rows.filter(r => r.status === "rejected").length,
      },
    };
  });

export const setReviewerFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ email: z.string().email().max(200), role: z.enum(["admin", "moderator"]), grant: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("set_reviewer", { _email: data.email, _role: data.role, _grant: data.grant });
    if (error) throw new Error("This change could not be saved. Only admins can manage reviewers.");
    if (result !== "ok") throw new Error(result ?? "This change could not be saved.");
    return { ok: true };
  });
