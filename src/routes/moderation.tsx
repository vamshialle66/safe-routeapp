import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/session";
import { ALERT_CATEGORIES, ALERT_URGENCY } from "@/lib/communityAlerts";
import { reviewQueueFn, moderateAlertFn } from "@/lib/communityAlerts.functions";

export const Route = createFileRoute("/moderation")({
  head: () => ({
    meta: [
      { title: "Review community reports — SafeRoute" },
      { name: "description", content: "Approve or reject community concern reports before they appear as tips." },
      { property: "og:title", content: "Review community reports — SafeRoute" },
      { property: "og:description", content: "Reviewer tools for SafeRoute community reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ModerationPage,
});

const STATUS: Record<string, string> = { pending_review: "Waiting for review", approved: "Approved — shown as a tip", rejected: "Rejected" };

function ModerationPage() {
  const { user } = useSession();
  const queue = useServerFn(reviewQueueFn);
  const moderate = useServerFn(moderateAlertFn);
  const cache = useQueryClient();
  const key = ["review-queue", user?.id];
  const q = useQuery({ queryKey: key, queryFn: () => queue(), enabled: !!user });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(id); setError("");
    try { await moderate({ data: { id, decision, note: notes[id] } }); await cache.invalidateQueries({ queryKey: key }); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(null); }
  }

  const alerts = q.data?.alerts ?? [];
  const waiting = alerts.filter(a => a.status === "pending_review");
  const done = alerts.filter(a => a.status !== "pending_review");

  return <AppLayout title="Review community reports">
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="outline" size="sm"><Link to="/admin">Admin dashboard</Link></Button>
      <p className="text-sm text-muted-foreground">Approved reports appear to signed-in users as community tips. Tips show only the category, location and wording — never the reporter or their original description. They stay marked unverified and never change route scores.</p>
      {!user ? <Button asChild><Link to="/login">Sign in to review reports</Link></Button>
        : q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
        : q.error ? <p className="text-sm text-risk">Reports could not be loaded.</p>
        : !q.data?.allowed ? <p className="rounded-lg border border-border bg-card p-4 text-sm">Only reviewers can see this page. Ask the app owner for reviewer access.</p>
        : <>
          {error && <p role="alert" className="text-sm text-risk">{error}</p>}
          <h2 className="font-display text-lg font-semibold">Waiting for review ({waiting.length})</h2>
          {!waiting.length && <p className="text-sm text-muted-foreground">Nothing waiting right now.</p>}
          {[...waiting, ...done].map(a => <article key={a.id} className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="text-xs font-semibold text-moderate">{STATUS[a.status] ?? a.status} · {ALERT_URGENCY[a.urgency as keyof typeof ALERT_URGENCY]}</p>
            <p className="mt-1 font-medium">{ALERT_CATEGORIES[a.category as keyof typeof ALERT_CATEGORIES]} · {a.location_label}</p>
            <p className="mt-2 break-words text-sm">{a.summary}</p>
            <details className="mt-2 text-sm text-muted-foreground"><summary className="cursor-pointer">Reporter's own words (never shown publicly)</summary><p className="mt-1 break-words">{a.concern}</p></details>
            {a.moderator_note && <p className="mt-2 text-xs text-muted-foreground">Note: {a.moderator_note}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input className="max-w-xs" placeholder="Optional note (private)" maxLength={500} value={notes[a.id] ?? ""} onChange={e => setNotes({ ...notes, [a.id]: e.target.value })} />
              {a.status !== "approved" && <Button size="sm" disabled={busy === a.id} onClick={() => void decide(a.id, "approved")}>{busy === a.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve</Button>}
              {a.status !== "rejected" && <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => void decide(a.id, "rejected")}><X className="size-4" /> Reject</Button>}
            </div>
          </article>)}
        </>}
    </div>
  </AppLayout>;
}
