import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareWarning, Sparkles, Loader2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/session";
import { ALERT_CATEGORIES, ALERT_URGENCY, concernSchema, reviewSchema, routeBoundingBox } from "@/lib/communityAlerts";
import { classifyAlertFn, listAlertsFn, reviewAlertFn, deleteAlertFn, communityTipsFn, areaReportsFn } from "@/lib/communityAlerts.functions";
import { MapPointPicker } from "@/components/map/MapPointPicker";
import type { LatLng } from "@/lib/saferouteApi";
import type { Database } from "@/integrations/supabase/types";

type Alert = Database["public"]["Tables"]["community_alerts"]["Row"];
export function CommunityAlerts({ journeyId, routeLabel, routeGeometry }: { journeyId: string; routeLabel: string; routeGeometry?: LatLng[] | undefined }) {
  const { user } = useSession();
  const classify = useServerFn(classifyAlertFn);
  const list = useServerFn(listAlertsFn);
  const review = useServerFn(reviewAlertFn);
  const remove = useServerFn(deleteAlertFn);
  const tipsFn = useServerFn(communityTipsFn);
  // Only tips pinned along this route's path are shown as route tips.
  const bbox = useMemo(() => (routeGeometry?.length ? routeBoundingBox(routeGeometry) : null), [routeGeometry]);
  const bboxKey = bbox ? `${bbox.minLat.toFixed(4)},${bbox.minLng.toFixed(4)},${bbox.maxLat.toFixed(4)},${bbox.maxLng.toFixed(4)}` : "all";
  const tips = useQuery({ queryKey: ["community-tips", user?.id, bboxKey], queryFn: () => tipsFn({ data: bbox ?? {} }), enabled: !!user });
  const areasFn = useServerFn(areaReportsFn);
  const areas = useQuery({ queryKey: ["area-reports", user?.id], queryFn: () => areasFn(), enabled: !!user });
  const cache = useQueryClient();
  const key = ["community-alerts", user?.id, journeyId];
  const saved = useQuery({ queryKey: key, queryFn: () => list({ data: { journeyId } }), enabled: !!user });
  const [editing, setEditing] = useState(false);
  const [concern, setConcern] = useState("");
  const [location, setLocation] = useState("");
  const [pin, setPin] = useState<LatLng | null>(null);
  const [draft, setDraft] = useState<Alert | null>(null);
  const [category, setCategory] = useState("other");
  const [urgency, setUrgency] = useState("informational");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function edit(alert: Alert) {
    setDraft(alert); setCategory(alert.category); setUrgency(alert.urgency); setSummary(alert.summary);
    setConcern(alert.concern); setLocation(alert.location_label); setEditing(true); setError(""); setSuccess("");
  }
  async function classifyInput() {
    setError(""); setSuccess("");
    const valid = concernSchema.safeParse({
      journeyId, routeLabel, locationLabel: location, concern,
      ...(pin ? { latitude: pin.latitude, longitude: pin.longitude } : {}),
    });
    if (!valid.success) { setError(valid.error.issues[0]?.message ?? "Please check your description."); return; }
    setBusy(true);
    try {
      const result = await classify({ data: valid.data });
      if (!result.alert) { setError(result.error ?? "AI classification unavailable."); return; }
      edit(result.alert); await cache.invalidateQueries({ queryKey: key });
    } catch (e) { setError(e instanceof Error ? e.message : "The concern could not be classified."); }
    finally { setBusy(false); }
  }
  async function saveReview() {
    if (!draft) return;
    setError("");
    const valid = reviewSchema.safeParse({ id: draft.id, category, urgency, summary });
    if (!valid.success) { setError("Please choose a category and describe the concern in 10–500 characters."); return; }
    setBusy(true);
    try {
      await review({ data: valid.data }); await cache.invalidateQueries({ queryKey: key });
      setDraft(null); setEditing(false); setConcern(""); setLocation(""); setPin(null);
      setSuccess("Sent for review. A reviewer will approve or reject it; until then only you can see it.");
    } catch (e) { setError(e instanceof Error ? e.message : "Your review could not be saved."); }
    finally { setBusy(false); }
  }
  async function discard(id: string) {
    setBusy(true); setError("");
    try {
      await remove({ data: { id } }); await cache.invalidateQueries({ queryKey: key });
      if (draft?.id === id) { setDraft(null); setEditing(false); }
    } catch { setError("Your alert could not be deleted."); }
    finally { setBusy(false); }
  }
  function closeForm() { setEditing(false); setError(""); setPin(null); }

  return <section className="border-y border-border py-5" aria-label="Community alerts">
    <div className="flex items-center gap-2"><MessageSquareWarning className="size-5 shrink-0 text-primary" /><h2 className="font-display font-semibold">Community alerts</h2></div>
    <p className="mt-2 text-sm text-muted-foreground">Describe something you noticed on this route. AI suggests a category; you check the wording. Reports stay private until a reviewer approves them. Approved reports show to others as unverified tips — without your name or original words — and never change route scores.</p>
    <p className="mt-2 text-xs text-muted-foreground">In immediate danger? <Link to="/emergency" className="text-risk underline">Get emergency help</Link>. Reporting here does not contact emergency services.</p>
    {!user ? <Button asChild variant="outline" className="mt-4"><Link to="/login">Sign in to report a concern</Link></Button> : <>
      {!editing && <Button variant="outline" className="mt-4" onClick={() => { setDraft(null); setConcern(""); setLocation(""); setPin(null); setEditing(true); setError(""); setSuccess(""); }}><MessageSquareWarning className="size-4" /> Report a concern</Button>}
      {editing && <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); void (draft ? saveReview() : classifyInput()); }}>
        <p className="text-sm font-semibold">{draft ? "Review your community alert" : "What did you notice?"}</p>
        {!draft ? <>
          <div className="space-y-2"><Label htmlFor="concern-location">Where along the route?</Label><Input id="concern-location" value={location} onChange={e => setLocation(e.target.value)} maxLength={250} placeholder="For example, near the station entrance" disabled={busy} required /></div>
          {!!routeGeometry?.length && <div className="space-y-2">
            <Label htmlFor="concern-map">Pin the exact spot on the map (optional)</Label>
            <div id="concern-map" className="h-56 overflow-hidden rounded-xl border border-border"><MapPointPicker geometry={routeGeometry} value={pin} onChange={setPin} /></div>
            <p className="text-xs text-muted-foreground">{pin ? "Spot pinned. Others will see this report when they plan a route that passes here." : "Tap the map to pin where you noticed it — pinned reports only appear on routes that pass the spot."}{pin && <> <button type="button" className="text-primary underline" onClick={() => setPin(null)}>Remove pin</button></>}</p>
          </div>}
          <div className="space-y-2"><Label htmlFor="concern-description">Describe your concern</Label><Textarea id="concern-description" value={concern} onChange={e => setConcern(e.target.value)} maxLength={2000} rows={4} placeholder="For example, the path near the station was very dark this evening." disabled={busy} required /><p className="text-xs text-muted-foreground">Avoid names, phone numbers and personal details. Your description is sent to AI for classification. {concern.length}/2000</p></div>
        </> : <>
          <p className="text-xs font-semibold text-moderate">AI-classified · Unverified · Not published</p>
          <p className="break-words text-sm text-muted-foreground">Location: {draft.location_label}</p>
          <div className="space-y-2"><Label htmlFor="alert-category">Category</Label><Select value={category} onValueChange={setCategory} disabled={busy}><SelectTrigger id="alert-category"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ALERT_CATEGORIES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="alert-urgency">Suggested attention</Label><Select value={urgency} onValueChange={setUrgency} disabled={busy}><SelectTrigger id="alert-urgency"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ALERT_URGENCY).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="alert-summary">Alert wording</Label><Textarea id="alert-summary" value={summary} onChange={e => setSummary(e.target.value)} maxLength={500} rows={4} disabled={busy} required /></div>
          {urgency === "urgent" && <p className="text-sm text-risk">If someone needs help now, use emergency tools rather than waiting for review.</p>}
          <p className="text-xs text-muted-foreground">AI can misunderstand. Check the category and wording before saving. After saving, a reviewer decides whether it is shared as a community tip.</p>
        </>}
        <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{busy ? "Please wait…" : draft ? "Save for review" : "Classify with AI"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={closeForm}>Close</Button></div>
      </form>}
      {saved.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading your alerts…</p>}
      {saved.error && <div className="mt-3 text-sm text-risk">Your alerts could not be loaded. <Button variant="ghost" size="sm" onClick={() => void saved.refetch()}>Try again</Button></div>}
      {!!saved.data?.length && <div className="mt-5"><h3 className="text-sm font-semibold">Your reports for this journey</h3><ul className="mt-2 divide-y divide-border">{saved.data.map(alert => <li key={alert.id} className="py-3">
        <p className="text-xs font-semibold text-moderate">Community alert · Unverified · {({ draft: "Draft", pending_review: "Awaiting review", approved: "Approved — shared as a tip", rejected: "Not approved" } as Record<string, string>)[alert.status] ?? alert.status}</p>
        <p className="mt-1 text-sm font-medium">{ALERT_CATEGORIES[alert.category as keyof typeof ALERT_CATEGORIES]}</p><p className="mt-1 break-words text-sm">{alert.summary}</p><p className="mt-1 break-words text-xs text-muted-foreground">{alert.route_label} · {alert.location_label} · {ALERT_URGENCY[alert.urgency as keyof typeof ALERT_URGENCY]}</p>
        <div className="mt-2 flex gap-2"><Button variant="ghost" size="sm" disabled={busy} onClick={() => edit(alert)}><Pencil className="size-3.5" /> Review</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => void discard(alert.id)}><Trash2 className="size-3.5" /> Delete</Button></div>
      </li>)}</ul></div>}
    </>}
    {!!areas.data?.length && <div className="mt-5"><h3 className="text-sm font-semibold">Most reported areas</h3><p className="text-xs text-muted-foreground">Where approved community reports come from most. Unverified — not a crime statistic.</p><ul className="mt-2 divide-y divide-border">{areas.data.map(a => <li key={a.location_label} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="break-words">{a.location_label}</span><span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">{a.reports} report{a.reports === 1 ? "" : "s"}</span></li>)}</ul></div>}
    <div className="mt-5">
      <h3 className="text-sm font-semibold">{bbox ? "Tips along this route" : "Community tips"}</h3>
      <p className="text-xs text-muted-foreground">{bbox ? "Reports approved by a reviewer that were pinned along this route. Unverified — use your own judgement." : "Recent reports approved by a reviewer. Unverified — use your own judgement."}</p>
      {tips.isLoading && <p className="mt-2 text-sm text-muted-foreground">Loading tips…</p>}
      {tips.error && <p className="mt-2 text-sm text-muted-foreground">Tips could not be loaded right now.</p>}
      {!tips.isLoading && !tips.error && !tips.data?.length && <p className="mt-2 text-sm text-muted-foreground">{bbox ? "No community tips have been pinned along this route yet." : "No community tips have been approved yet."}</p>}
      {!!tips.data?.length && <ul className="mt-2 divide-y divide-border">{tips.data.map(t => <li key={t.id} className="py-2"><p className="text-sm font-medium">{ALERT_CATEGORIES[t.category as keyof typeof ALERT_CATEGORIES]} · {t.location_label}</p><p className="break-words text-sm">{t.summary}</p><p className="text-xs text-muted-foreground">{ALERT_URGENCY[t.urgency as keyof typeof ALERT_URGENCY]}</p></li>)}</ul>}
    </div>
    {error && <p role="alert" className="mt-3 break-words text-sm text-risk">{error}</p>}
    {success && <p role="status" className="mt-3 text-sm text-safe">{success}</p>}
  </section>;
}
