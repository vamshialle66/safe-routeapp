import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserPlus, UserMinus, Loader2, Inbox } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/session";
import { adminOverviewFn, setReviewerFn } from "@/lib/communityAlerts.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — SafeRoute" },
      { name: "description", content: "Manage reviewers and see the community report queue at a glance." },
      { property: "og:title", content: "Admin dashboard — SafeRoute" },
      { property: "og:description", content: "SafeRoute admin tools for reviewer management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useSession();
  const overview = useServerFn(adminOverviewFn);
  const setReviewer = useServerFn(setReviewerFn);
  const cache = useQueryClient();
  const key = ["admin-overview", user?.id];
  const q = useQuery({ queryKey: key, queryFn: () => overview(), enabled: !!user });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function change(emailToChange: string, role: "admin" | "moderator", grant: boolean) {
    setBusy(true); setError(""); setMessage("");
    try {
      await setReviewer({ data: { email: emailToChange, role, grant } });
      setMessage(grant ? `${emailToChange} can now review reports.` : `${emailToChange} no longer has ${role} access.`);
      setEmail("");
      await cache.invalidateQueries({ queryKey: key });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }

  const counts = q.data?.counts;

  return <AppLayout title="Admin dashboard">
    <div className="mx-auto max-w-3xl space-y-6">
      {!user ? <Button asChild><Link to="/login">Sign in</Link></Button>
        : q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
        : q.error ? <p className="text-sm text-risk">Admin details could not be loaded.</p>
        : !q.data?.allowed ? <p className="rounded-lg border border-border bg-card p-4 text-sm">This page is only for admin accounts.</p>
        : <>
          <section className="grid grid-cols-3 gap-3">
            {[{ label: "Waiting for review", value: counts?.waiting ?? 0 }, { label: "Approved tips", value: counts?.approved ?? 0 }, { label: "Rejected", value: counts?.rejected ?? 0 }].map(c =>
              <div key={c.label} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="font-display text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>)}
          </section>
          <Button asChild variant="outline"><Link to="/moderation"><Inbox className="size-4" /> Open the review queue</Link></Button>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><UserPlus className="size-5" /> Add a reviewer</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter the email of someone who already has a SafeRoute account. Reviewers can approve or reject community reports; admins can also manage this list.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Input className="max-w-xs" type="email" placeholder="their@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <Button disabled={busy || !email.includes("@")} onClick={() => void change(email, "moderator", true)}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Add reviewer</Button>
              <Button variant="outline" disabled={busy || !email.includes("@")} onClick={() => void change(email, "admin", true)}><ShieldCheck className="size-4" /> Make admin</Button>
            </div>
            {message && <p className="mt-2 text-sm text-safe">{message}</p>}
            {error && <p role="alert" className="mt-2 text-sm text-risk">{error}</p>}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-semibold">People with access ({q.data.reviewers.length})</h2>
            <ul className="mt-3 divide-y divide-border">
              {q.data.reviewers.map(r => <li key={`${r.user_id}-${r.role}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="break-all">{r.email} <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{r.role === "admin" ? "Admin" : "Reviewer"}</span></span>
                <Button size="sm" variant="ghost" disabled={busy || (r.role === "admin" && r.user_id === user.id)} onClick={() => void change(r.email, r.role as "admin" | "moderator", false)}>
                  <UserMinus className="size-4" /> Remove
                </Button>
              </li>)}
            </ul>
          </section>
        </>}
    </div>
  </AppLayout>;
}
