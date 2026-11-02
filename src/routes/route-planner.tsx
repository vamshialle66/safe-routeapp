import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navigation, ArrowDownUp, ArrowRight, Bookmark, Crosshair, Flag, Loader2, MapPin, Sparkles } from "lucide-react";
import { googleDirectionsUrl } from "@/lib/directions";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteMap } from "@/components/map/RouteMap";
import { PlaceSearch } from "@/components/common/PlaceSearch";
import { Button } from "@/components/ui/button";
import { IndexRing, IndexPill } from "@/components/route/IndexPill";
import { Disclaimer, SourceBadge } from "@/components/route/Disclaimer";
import { analysisStore, useCurrentAnalysis, type NamedPoint } from "@/lib/analysisStore";
import { currentPosition, SAMPLE_DESTINATION, SAMPLE_ORIGIN } from "@/lib/geocode";
import { runAnalysis } from "@/lib/runAnalysis";
import {
  TRAVEL_MODES,
  formatDistance,
  formatDuration,
  topRouteNumbers,
  type BackendTravelMode,
} from "@/lib/saferouteApi";
import { cn } from "@/lib/utils";
import { MiniHero } from "@/components/layout/MiniHero";
import { MapLegend } from "@/components/map/MapLegend";
import { routeComparisonValue } from "@/lib/routeAssessment";
import { CommunityAlerts } from "@/components/route/CommunityAlerts";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/route-planner")({
  head: () => ({
    meta: [
      { title: "Plan a Route — SafeRoute" },
      { name: "description", content: "Enter a start and destination to compare alternative routes by how many places along the way are open right now." },
      { property: "og:title", content: "Plan a Route — SafeRoute" },
      { property: "og:description", content: "Find routes and compare nearby open places, travel time and distance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlannerPage,
});

const STAGES = ["Finding routes to your destination", "Finding shops and services along the way", "Checking which places are open", "Getting your route options ready"];

function PlannerPage() {
  const analysis = useCurrentAnalysis();
  const session = useSession();
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(true);
  const [origin, setOrigin] = useState<NamedPoint | null>(analysis?.origin ?? null);
  const [destination, setDestination] = useState<NamedPoint | null>(analysis?.destination ?? null);
  const [mode, setMode] = useState<BackendTravelMode>(analysis?.travelMode ?? "WALK");
  const [when, setWhen] = useState<"now" | "evening" | "latenight">("now");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<number | undefined>(analysis?.routes[0]?.routeNumber);

  const routes = showResults ? analysis?.routes ?? [] : [];
  const best = topRouteNumbers(routes);
  const sorted = [...routes].sort((a, b) => (routeComparisonValue(b) ?? -1) - (routeComparisonValue(a) ?? -1));
  const onSelect = useCallback((n: number) => setSelected(n), []);

  async function analyze(sample = false) {
    const start = sample ? SAMPLE_ORIGIN : origin;
    const end = sample ? SAMPLE_DESTINATION : destination;
    if (!start || !end) {
      toast.error("Pick a start and a destination from the suggestions.");
      return;
    }
    setLoading(true);
    setSearchError(null);
    setShowResults(false);
    if (sample) { setOrigin(start); setDestination(end); }
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1600);
    try {
      const { analysis: a } = await runAnalysis(start, end, mode, sample);
      setShowResults(true);
      const top = [...topRouteNumbers(a.routes)][0] ?? a.routes[0]?.routeNumber;
      setSelected(top);
      if (!a.routes.length) toast.message("No routes were found between these places.");
      else toast.success(a.source === "demo" ? `${a.routes.length} example routes ready — not current conditions` : `${a.routes.length} routes found using current map data`);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Couldn't find routes. Please try again.");
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  async function useMyLocation() {
    setLocating(true);
    try {
      setOrigin(await currentPosition());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Location unavailable");
    } finally {
      setLocating(false);
    }
  }

  return (
    <AppLayout title="Plan Route" fullBleed>
      <MiniHero className="m-4 mb-0 lg:hidden" title="Plan Route" description="Where are you heading? Enter a start and destination, then compare open places, time and distance." />
      <div className="flex flex-col pt-4 lg:h-[calc(100vh-4rem)] lg:flex-row lg:pt-0">
        <section className="order-2 flex w-full flex-col border-r border-border bg-card lg:order-1 lg:w-[420px] lg:overflow-y-auto">
          <div className="space-y-4 border-b border-border p-5">
            <MiniHero className="hidden lg:block" title="Plan Route" description="Where are you heading? Enter a start and destination, then compare open places, time and distance." />
            <div className="space-y-1">
              <PlaceSearch
                label="Start"
                icon={MapPin}
                value={origin}
                onChange={setOrigin}
                placeholder="Where are you starting?"
                trailing={
                  <Button type="button" variant="ghost" size="icon" className="size-10" onClick={useMyLocation} aria-label="Use my current location" disabled={locating}>
                    {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
                  </Button>
                }
              />
              <div className="flex items-center gap-2 py-1">
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full bg-card px-4"
                  aria-label="Swap start and destination"
                  onClick={() => {
                    setOrigin(destination);
                    setDestination(origin);
                  }}
                >
                  <ArrowDownUp className="size-4" /> Swap
                </Button>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <PlaceSearch label="Destination" icon={Flag} value={destination} onChange={setDestination} placeholder="Where to?" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">How are you travelling?</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Travel mode">
                {TRAVEL_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={mode === m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      mode === m.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">When are you going?</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Departure time">
                {([["now", "Leave now"], ["evening", "This evening"], ["latenight", "Late night"]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={when === v}
                    onClick={() => setWhen(v)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      when === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {when !== "now" && <p className="mt-1.5 text-xs text-muted-foreground">Scores show places open right now. Recheck just before you leave — opening hours change.</p>}
            </div>

            {!session.user && session.ready && <p className="text-sm text-muted-foreground"><Link to="/login" className="font-medium text-primary underline">Sign in</Link> to find real routes. Google Maps searches require an account.</p>}
            <Button size="lg" className="w-full" onClick={() => analyze()} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? STAGES[stage] + "…" : "Find routes"}
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => analyze(true)} disabled={loading}>View an example — not for navigation</Button>
          </div>

          <div className="flex-1 space-y-3 p-5">
            {searchError && <div role="alert" className="border-l-2 border-risk pl-3 text-sm"><p className="font-semibold">Real routes couldn't be loaded</p><p className="mt-1 text-muted-foreground">{searchError} No sample routes have been substituted.</p><Button asChild variant="link" className="px-0"><Link to="/settings">Check map data settings</Link></Button></div>}
            {loading && (
              <ol className="space-y-2">
                {STAGES.map((s, i) => (
                  <li key={s} className={cn("flex items-center gap-2 text-sm", i <= stage ? "text-foreground" : "text-muted-foreground/60")}>
                    <span className={cn("size-2 rounded-full", i < stage ? "bg-safe" : i === stage ? "animate-pulse bg-primary" : "bg-muted")} />
                    {s}
                  </li>
                ))}
              </ol>
            )}

            {!loading && analysis && routes.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{routes.length} routes compared</h2>
                  <SourceBadge source={analysis.source} />
                </div>
                <p className="text-xs text-muted-foreground">{analysis.source === "demo" ? "Illustration only. These paths and places are invented; do not follow them." : `Checked ${new Date(analysis.createdAt).toLocaleString()}. Opening status can change; search again before travelling.`}</p>
                {sorted.map((r) => {
                  const isSel = r.routeNumber === selected;
                  const isBest = best.has(r.routeNumber);
                  return (
                    <div
                      key={r.routeNumber}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition-all",
                        isSel ? "border-primary bg-primary-soft shadow-soft" : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      <button type="button" className="flex w-full items-center gap-4 text-left" onClick={() => setSelected(r.routeNumber)}>
                        <IndexRing value={r.safetyIndex} size={56} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-semibold">Route {r.routeNumber}</span>
                            {isBest && (
                              <span className="rounded-full bg-safe px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">{r.assessment ? "Higher comparison score" : "Most open places"}</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {formatDistance(r.distanceMeters)} · {formatDuration(r.duration)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {r.safetyIndex == null ? "Opening hours unavailable along this route" : `Open-places score: ${Math.round(r.safetyIndex)} out of 100`}
                          </p>
                          {r.assessment && <p className="mt-1 text-xs text-muted-foreground">Comparison: {r.assessment.score ?? "not enough information"}{r.assessment.score != null ? "/100" : ""} · {r.assessment.helpPlaces.length} help locations reported open</p>}
                        </div>
                      </button>
                      {isSel && (
                        <div className="mt-3 flex gap-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link to="/routes/$id" params={{ id: String(r.routeNumber) }}>
                              Details <ArrowRight className="size-3.5" />
                            </Link>
                          </Button>
                          {analysis.source === "live" && <Button asChild size="sm" variant="outline">
                            <a href={googleDirectionsUrl(analysis.origin, analysis.destination, analysis.travelMode, r)} target="_blank" rel="noopener noreferrer">
                              <Navigation className="size-3.5" /> Directions
                            </a>
                          </Button>}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const ok = analysisStore.saveRoute(analysis, r.routeNumber);
                              toast[ok ? "success" : "message"](ok ? "Route saved" : "Already saved");
                            }}
                          >
                            <Bookmark className="size-3.5" /> Save
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/routes">Compare side by side</Link>
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">Options are ranked by observed open-place density and nearby help, not shop opening percentages alone. Crime and lighting are not verified. Below 50% information coverage, no comparison score is given.</p>
                <Disclaimer />
                <CommunityAlerts key={analysis.id} journeyId={analysis.id} routeLabel={selected ? `Route ${selected}` : "Journey"} routeGeometry={analysis.routes.find((r) => r.routeNumber === selected)?.segments.flatMap((s) => s.geometry)} />
              </>
            )}

            {!loading && !analysis && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Your route options will appear here after you choose a start and destination.
              </div>
            )}
          </div>
        </section>

        <section className="relative order-1 h-[45vh] min-h-[300px] flex-none sm:h-[52vh] lg:flex-1 lg:order-2 lg:h-auto">
          <RouteMap
            routes={routes}
            selectedRoute={selected}
            onSelectRoute={onSelect}
            origin={origin ?? undefined}
            destination={destination ?? undefined}
          />
          <MapLegend />
        </section>
      </div>
    </AppLayout>
  );
}

