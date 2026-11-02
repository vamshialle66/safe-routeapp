import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Post-walk ratings are community confidence signals only — they are shown
// as "X of Y walkers felt safe" and never feed into route scores.
export const rateRouteFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({
    journeyId: z.string().min(1).max(100),
    routeNumber: z.number().int().min(1).max(10),
    feltSafe: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("route_ratings").upsert(
      { user_id: context.userId, journey_id: data.journeyId, route_number: data.routeNumber, felt_safe: data.feltSafe },
      { onConflict: "user_id,journey_id,route_number" },
    );
    if (error) throw new Error("Your rating could not be saved. Please try again.");
    return { ok: true };
  });

export const routeConfidenceFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ journeyId: z.string().min(1).max(100), routeNumber: z.number().int().min(1).max(10) }).parse(input))
  .handler(async ({ data, context }) => {
    const [confidence, mine] = await Promise.all([
      context.supabase.rpc("route_confidence", { _journey_id: data.journeyId, _route_number: data.routeNumber }),
      context.supabase.from("route_ratings").select("felt_safe").eq("user_id", context.userId).eq("journey_id", data.journeyId).eq("route_number", data.routeNumber).maybeSingle(),
    ]);
    if (confidence.error) throw new Error("Walker ratings could not be loaded.");
    const row = confidence.data?.[0];
    return { safeCount: Number(row?.safe_count ?? 0), totalCount: Number(row?.total_count ?? 0), mine: mine.data?.felt_safe ?? null };
  });
