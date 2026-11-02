import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Navigation, Clock, MapPin, Radio, Route as RouteIcon, Share2, Store } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteMap } from "@/components/map/RouteMap";
import { Button } from "@/components/ui/button";
import { IndexPill, IndexRing, TONE_CLASSES } from "@/components/route/IndexPill";
import { Disclaimer, SourceBadge } from "@/components/route/Disclaimer";
import { EmptyState } from "@/components/common/EmptyState";
import { analysisStore, useCurrentAnalysis } from "@/lib/analysisStore";
import { formatDistance, formatDuration, formatIndex, indexTone } from "@/lib/saferouteApi";
import { cn } from "@/lib/utils";
import { googleDirectionsUrl } from "@/lib/directions";
import { RouteAssessmentPanel } from "@/components/route/RouteAssessmentPanel";
import { CommunityAlerts } from "@/components/route/CommunityAlerts";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { rateRouteFn, routeConfidenceFn } from "@/lib/routeRatings.functions";

export const Route = createFileRoute("/routes/$id")({
  head: () => ({
    meta: [
      { title: "Route Details — SafeRoute" },
      { name: "description", content: "See your journey on the map, check nearby open places and open directions in Google Maps." },
      { property: "og:title", content: "Route Details — SafeRoute" },
      { property: "og:description", content: "Check nearby open places along your journey and get directions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RouteDetail,
});

function RouteDetail() {
  const { id } = Route.useParams();
  const analysis = useCurrentAnalysis();
  const route = analysis?.routes.find((r) => String(r.routeNumber) === id);
  const [hl, setHl] = useState<number | undefined>();

  if (!analysis || !route) {
    return (
      <AppLayout title="Route details">
        <EmptyState
          icon={RouteIcon}
          title="No route to show yet"
          description="Choose a start and destination in Plan Route, then select a route to see its details."
          action={<Button asChild><Link to="/route-planner">Plan a route</Link></Button>}
        />
      </AppLayout>
    );
  }

  let distanceFromStart = 0;
  const chart = route.segments.map((s) => {
    const start = distanceFromStart;
    distanceFromStart += s.lengthMeters;
    return { n: s.segmentNumber, range: `${formatDistance(start)} – ${formatDistance(distanceFromStart)} from start`, v: s.safetyIndex ?? 0, has: s.safetyIndex != null, tone: indexTone(s.safetyIndex) };
  });
  const totalPlaces = route.segments.reduce((a, s) => a + s.placeCount, 0);
  const openPlaces = route.segments.reduce((a, s) => a + s.openPlaceCount, 0);
  const lowStretches = route.segments.filter((s) => indexTone(s.safetyIndex) === "risk");
  const coverage = route.distanceMeters ? Math.round((route.scoredLengthMeters / route.distanceMeters) * 100) : 0;

  async function shareRoute() {
    if (!analysis || !route) return;
    const score = route.safetyIndex != null ? `${formatIndex(route.safetyIndex)}/100` : "not scored";
    const text = `I'm taking this route: ${analysis.origin.label.split(",")[0]} → ${analysis.destination.label.split(",")[0]} (${formatDistance(route.distanceMeters)}, about ${formatDuration(route.duration)}). SafeRoute score: ${score}.`;
    try {
      if (navigator.share) await navigator.share({ title: "My route", text });
      else { await navigator.clipboard.writeText(text); toast.success("Route summary copied — paste it anywhere"); }
    } catch { /* user cancelled sharing */ }
  }

  return (
    <AppLayout
      title={`Route ${route.routeNumber}`}
      description={`${analysis.origin.label.split(",")[0]} → ${analysis.destination.label.split(",")[0]}`}
      actions={
        <div className="flex flex-wrap gap-2">
          {analysis.source === "live" && <Button asChild className="bg-safe text-safe-foreground hover:bg-safe/90">
            <a href={googleDirectionsUrl(analysis.origin, analysis.destination, analysis.travelMode, route)} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-4" /> Open Google Maps
            </a>
          </Button>}
          <Button asChild variant="outline" className="bg-card text-card-foreground"><Link to="/routes"><ArrowLeft className="size-4" /> All routes</Link></Button>
          <Button onClick={() => toast[analysisStore.saveRoute(analysis, route.routeNumber) ? "success" : "message"]("Saved to your routes")}>
            <Bookmark className="size-4" /> Save
          </Button>
          <Button variant="outline" className="bg-card text-card-foreground" onClick={() => void shareRoute()}>
            <Share2 className="size-4" /> Share
          </Button>
          {analysis.source === "live" && (
            <Button asChild variant="outline" className="bg-card text-card-foreground">
              <Link to="/trip/live" search={{ route: route.routeNumber }}><Radio className="size-4" /> Share live trip</Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <p className="text-sm text-muted-foreground lg:col-span-2">{analysis.source === "demo" ? "Example only — paths and places are invented, not suitable for navigation." : `Checked ${new Date(analysis.createdAt).toLocaleString()}. These are saved results, not continuous monitoring. Plan again for current opening status.`}</p>
        <div className="space-y-6">
          <div className="relative h-[300px] sm:h-[380px] overflow-hidden rounded-2xl border border-border">
            <RouteMap routes={[route]} selectedRoute={route.routeNumber} highlightSegment={hl} origin={analysis.origin} destination={analysis.destination} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-semibold">Where are places open along the way?</h2>
              <span className="text-xs text-muted-foreground">Your journey, from start to destination</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Taller bars mean a higher percentage of nearby places are open. Grey means opening hours are unavailable.</p>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} onMouseMove={(s) => setHl(s?.activeLabel ? Number(s.activeLabel) : undefined)} onMouseLeave={() => setHl(undefined)}>
                  <XAxis dataKey="n" tick={false} axisLine={false} />
                  <YAxis domain={[0, 100]} width={28} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    formatter={(v: number, _n, p) => [p.payload.has ? v.toFixed(0) : "No data", "Open-places score"]}
                    labelFormatter={(l) => chart.find((c) => c.n === Number(l))?.range ?? "Along your route"}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                  />
                  <Bar dataKey="v" radius={[3, 3, 0, 0]} minPointSize={3}>
                    {chart.map((c) => (
                      <Cell key={c.n} fill={c.tone === "none" ? "var(--muted-foreground)" : `var(--${c.tone})`} fillOpacity={c.has ? 0.9 : 0.25} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <h2 className="border-b border-border px-5 py-4 font-display font-semibold">Nearby places along your journey</h2>
            <ul className="divide-y divide-border">
              {route.segments.map((s, i) => {
                const tone = indexTone(s.safetyIndex);
                return (
                  <li key={s.segmentNumber} onMouseEnter={() => setHl(s.segmentNumber)} onMouseLeave={() => setHl(undefined)} className={cn("flex items-center gap-4 px-5 py-3 transition-colors", hl === s.segmentNumber && "bg-accent")}>
                    <span className={cn("h-8 w-1 rounded-full", TONE_CLASSES[tone].bar)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{chart[i]?.range}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.placeCount === 0 ? "No places found nearby" : `${s.scoredPlaceCount ? `${s.openPlaceCount} of ${s.scoredPlaceCount} checked places open` : "Opening hours unavailable"} · ${s.places.slice(0, 3).map((p) => p.name).join(", ")}`}
                      </p>
                    </div>
                    <IndexPill value={s.safetyIndex} showLabel={false} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <WalkerRating key={`rating-${analysis.id}:${route.routeNumber}`} journeyId={analysis.id} routeNumber={route.routeNumber} />
          <CommunityAlerts key={`${analysis.id}:${route.routeNumber}`} journeyId={analysis.id} routeLabel={`Route ${route.routeNumber}`} routeGeometry={route.segments.flatMap((s) => s.geometry)} />
          {route.assessment && <div className="border-b border-border pb-4"><h2 className="font-display font-semibold">Route comparison score</h2><p className="mt-2 text-2xl font-semibold text-primary">{route.assessment.score == null ? "Not enough information" : `${route.assessment.score} / 100`}</p><p className="mt-2 text-sm text-muted-foreground">Open-place density and nearby help. Not a probability of safety.</p>{route.assessment.reasons.map(reason => <p key={reason} className="mt-2 text-xs text-muted-foreground">{reason}</p>)}</div>}
          <RouteAssessmentPanel route={route} sample={analysis.source === "demo"} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Open-places score</span>
              <SourceBadge source={analysis.source} />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <IndexRing value={route.safetyIndex} size={88} />
              <div>
                <p className={cn("font-display text-lg font-semibold", TONE_CLASSES[indexTone(route.safetyIndex)].text)}>{TONE_CLASSES[indexTone(route.safetyIndex)].label}</p>
                <p className="text-xs text-muted-foreground">{route.safetyIndex == null ? "Not enough opening hours to calculate a score." : `${formatIndex(route.safetyIndex)} out of 100 — the average percentage of checked nearby places open along this journey.`}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Stat icon={RouteIcon} label="Distance" value={formatDistance(route.distanceMeters)} />
              <Stat icon={Clock} label="Travel time" value={formatDuration(route.duration)} />
              <Stat icon={Store} label="Nearby places" value={`${openPlaces} open · ${totalPlaces} found`} />
              <Stat icon={MapPin} label="Hours available" value={`${coverage}% of route`} />
            </dl>
          </div>

          {lowStretches.length > 0 && (
            <div className="rounded-2xl border border-risk/30 bg-risk-soft p-5">
              <p className="font-semibold text-risk">Fewer open places along the way</p>
              <p className="mt-1 text-sm text-foreground/80">
                Fewer than 40% of nearby places are open on {formatDistance(lowStretches.reduce((a, s) => a + s.lengthMeters, 0))} of this route. Consider sharing your trip with a contact.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3 bg-card"><Link to="/emergency">Emergency tools</Link></Button>
            </div>
          )}

          <details className="rounded-2xl border border-border bg-card p-5 text-sm">
            <summary className="cursor-pointer font-semibold">What does this score mean?</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>We check shops and services near your route.</li>
              <li>Only your chosen types of places affect the score.</li>
              <li>Places without known opening hours do not affect it.</li>
              <li>A score of 80 means 80% are open, averaged along your journey.</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">Longer distances contribute more to the average. A higher score does not mean the route is safer.</p>
          </details>
          <Disclaimer />
        </aside>
      </div>
    </AppLayout>
  );
}

function WalkerRating({ journeyId, routeNumber }: { journeyId: string; routeNumber: number }) {
  const { user } = useSession();
  const confidence = useServerFn(routeConfidenceFn);
  const rate = useServerFn(rateRouteFn);
  const cache = useQueryClient();
  const key = ["route-rating", journeyId, routeNumber];
  const q = useQuery({ queryKey: key, queryFn: () => confidence({ data: { journeyId, routeNumber } }), enabled: !!user });
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const d = q.data;

  async function vote(feltSafe: boolean) {
    setBusy(true);
    try {
      await rate({ data: { journeyId, routeNumber, feltSafe } });
      await cache.invalidateQueries({ queryKey: key });
      toast.success("Thanks — your rating helps other walkers");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display font-semibold">Walked this route?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {d && d.totalCount > 0
          ? `${d.safeCount} of ${d.totalCount} walkers said they felt safe on this route.`
          : "No walker ratings yet — be the first after your trip."}
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant={d?.mine === true ? "default" : "outline"} disabled={busy} onClick={() => void vote(true)}>
          <ThumbsUp className="size-4" /> Felt safe
        </Button>
        <Button size="sm" variant={d?.mine === false ? "default" : "outline"} disabled={busy} onClick={() => void vote(false)}>
          <ThumbsDown className="size-4" /> Not really
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Walker ratings are opinions — they never change the route score.</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
