import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Clock,
  Compass,
  Flag,
  LifeBuoy,
  MapPin,
  Navigation,
  Radar,
  Route as RouteIcon,
  Share2,
  Sparkles,
  Store,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { IndexRing, IndexPill, TONE_CLASSES } from "@/components/route/IndexPill";
import { SourceBadge } from "@/components/route/Disclaimer";
import { RouteMap } from "@/components/map/RouteMap";
import { MapLegend } from "@/components/map/MapLegend";
import { useCurrentAnalysis, useHistory, useSaved, analysisStore } from "@/lib/analysisStore";
import { formatDistance, formatDuration, indexTone, topRouteNumbers } from "@/lib/saferouteApi";
import { displayName, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SafeRoute" },
      { name: "description", content: "Your route options, nearby open places, recent trips and emergency contacts." },
      { property: "og:title", content: "Dashboard — SafeRoute" },
      { property: "og:description", content: "Plan journeys and keep your routes, trips and contacts together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Dashboard() {
  const current = useCurrentAnalysis();
  const history = useHistory();
  const saved = useSaved();
  const session = useSession();
  const now = useClock();
  const [selected, setSelected] = useState<number | undefined>();

  const routes = current?.routes ?? [];
  const bestSet = topRouteNumbers(routes);
  const best = routes.find((r) => bestSet.has(r.routeNumber)) ?? routes[0];
  const active = routes.find((r) => r.routeNumber === selected) ?? best;
  const fastest = [...routes].sort((a, b) => parseFloat(a.duration) - parseFloat(b.duration))[0];
  const hour = now?.getHours() ?? 12;
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const night = hour >= 19 || hour < 6;

  const raw = active?.segments.map((s) => s.safetyIndex) ?? [];
  const profile = raw.map((_, i) => {
    const w = raw.slice(Math.max(0, i - 4), i + 5).filter((x): x is number => x != null);
    return { i, v: w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0 };
  });
  const places = active?.segments.reduce((a, s) => a + s.placeCount, 0) ?? 0;
  const open = active?.segments.reduce((a, s) => a + s.openPlaceCount, 0) ?? 0;
  const quiet = active?.segments.filter((s) => indexTone(s.safetyIndex) === "risk").length ?? 0;

  return (
    <AppLayout title="My journeys" fullBleed>
      <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 lg:py-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-hero p-6 text-sidebar-accent-foreground shadow-lift sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-safe opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-safe" />
                  </span>
                  Plan your next journey
                </span>
                {now && (
                  <span className="glass-dark rounded-full px-3 py-1">
                    {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {night ? "Evening" : "Daytime"}
                  </span>
                )}
              </div>
              <h1 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-5xl">
                {greeting}{session.user ? `, ${displayName(session).split(" ")[0]}` : ""}.
                <br />
                <span className="text-sidebar-primary">Where would you like to go?</span>
              </h1>
              <p className="mt-3 max-w-md text-sm text-sidebar-foreground/80 sm:text-base">
                Find routes to your destination and compare nearby open shops, cafés and services before you choose.
              </p>
              {!session.user && session.ready && <p className="mt-3 text-sm text-sidebar-foreground">Sign in to search real Google Maps routes and nearby places. <Link to="/login" className="underline">Sign in</Link></p>}

              <Link
                to="/route-planner"
                className="group mt-6 flex max-w-lg items-center gap-3 rounded-2xl bg-card p-2 pl-4 text-card-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                <MapPin className="size-4 text-primary" />
                <span className="flex-1 text-sm text-muted-foreground">Search a destination…</span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                  <Sparkles className="size-4" /> Plan route
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { to: "/safety-map", icon: Radar, label: "Find nearby places" },
                  { to: "/saved-routes", icon: Bookmark, label: `${saved.length} saved` },
                  { to: "/emergency", icon: Share2, label: "Share my location" },
                ].map((q) => (
                  <Link key={q.label} to={q.to} className="glass-dark inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-colors hover:bg-sidebar-accent">
                    <q.icon className="size-3.5" /> {q.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Floating score card */}
            {active && current && (
              <div className="relative mx-auto w-full max-w-sm animate-float">
                <div className="absolute -inset-4 rounded-[2rem] bg-sidebar-primary/20 blur-2xl" aria-hidden="true" />
                <div className="relative rounded-3xl bg-card p-5 text-card-foreground shadow-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Latest route results</span>
                    <SourceBadge source={current.source} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium">
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">A</span>
                    <span className="truncate">{current.origin.label.split(",")[0]}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="grid size-6 place-items-center rounded-full bg-risk text-[10px] text-risk-foreground">B</span>
                    <span className="truncate">{current.destination.label.split(",")[0]}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <IndexRing value={active.safetyIndex} size={92} />
                    <div>
                      <p className={cn("font-display text-xl font-semibold", TONE_CLASSES[indexTone(active.safetyIndex)].text)}>
                        {TONE_CLASSES[indexTone(active.safetyIndex)].label}
                      </p>
                      <p className="text-xs text-muted-foreground">Route {active.routeNumber} · {formatDistance(active.distanceMeters)} · {formatDuration(active.duration)}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-14">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={profile}>
                        <defs>
                          <linearGradient id="dashg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--safe)" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="var(--safe)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="var(--safe)" strokeWidth={2} fill="url(#dashg)" isAnimationActive />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Open-places score, from start to finish</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric icon={Store} label="Places checked" value={places} sub={current ? `${open} reported open when checked${current.source === "demo" ? " · example" : ""}` : "plan a journey to check places"} tone="primary" />
          <Metric icon={RouteIcon} label="Routes compared" value={routes.length} sub="on your latest trip" tone="safe" />
          <Metric icon={Flag} label="Areas with fewer open places" value={quiet} sub="on the chosen route" tone={quiet ? "risk" : "safe"} />
          <Metric icon={Clock} label="Trips planned" value={history.length} sub={session.user ? "saved to your account" : "kept on this device"} tone="moderate" />
        </section>

        {/* MAP + ROUTES */}
        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="relative h-[340px] sm:h-[460px] overflow-hidden rounded-3xl border border-border shadow-soft">
            <RouteMap
              routes={routes}
              selectedRoute={active?.routeNumber}
              onSelectRoute={setSelected}
              origin={current?.origin}
              destination={current?.destination}
              showPlaces={false}
            />
            <MapLegend />
            {active && (
              <div className="glass absolute inset-x-3 bottom-3 z-[500] flex flex-wrap items-center gap-3 rounded-2xl p-3 sm:right-auto sm:max-w-md">
                <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Navigation className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Route {active.routeNumber} selected</p>
                  <p className="text-xs text-muted-foreground">{formatDistance(active.distanceMeters)} · {formatDuration(active.duration)}</p>
                </div>
                <Button asChild size="sm">
                  <Link to="/routes/$id" params={{ id: String(active.routeNumber) }}>Details <ArrowUpRight className="size-3.5" /></Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-lg font-semibold">Your options</h2>
              <Link to="/routes" className="text-xs font-medium text-primary hover:underline">Compare all</Link>
            </div>
            {routes.map((r, i) => {
              const isActive = r.routeNumber === active?.routeNumber;
              const tone = indexTone(r.safetyIndex);
              return (
                <button
                  key={r.routeNumber}
                  type="button"
                  onClick={() => setSelected(r.routeNumber)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={cn(
                    "animate-fade-up group relative overflow-hidden rounded-2xl border p-4 text-left transition-all",
                    isActive ? "border-primary bg-card shadow-lift" : "border-border bg-card card-hover",
                  )}
                >
                  <span className={cn("absolute inset-y-0 left-0 w-1", TONE_CLASSES[tone].bar)} />
                  <div className="flex items-center gap-3">
                    <IndexRing value={r.safetyIndex} size={52} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">Route {r.routeNumber}</span>
                        {bestSet.has(r.routeNumber) && <Tag className="bg-safe text-safe-foreground">{r.assessment ? "Higher comparison score" : "Most open places"}</Tag>}
                        {fastest?.routeNumber === r.routeNumber && <Tag className="bg-primary text-primary-foreground">Fastest</Tag>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDistance(r.distanceMeters)} · {formatDuration(r.duration)}</p>
                    </div>
                    <ArrowRight className={cn("size-4 text-muted-foreground transition-transform", isActive && "translate-x-0.5 text-primary")} />
                  </div>
                  <div className="mt-3 flex h-1.5 gap-px overflow-hidden rounded-full">
                    {r.segments.map((s) => (
                      <span key={s.segmentNumber} className={cn("flex-1", TONE_CLASSES[indexTone(s.safetyIndex)].bar)} />
                    ))}
                  </div>
                </button>
              );
            })}
            {!routes.length && <div className="py-6 text-sm text-muted-foreground"><p>No journeys yet.</p><Button asChild className="mt-3"><Link to="/route-planner">Plan your first journey <ArrowRight className="size-4" /></Link></Button></div>}

            <Link
              to="/emergency"
              className="group relative mt-auto flex items-center gap-4 overflow-hidden rounded-2xl bg-risk p-4 text-risk-foreground shadow-lift"
            >
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sweep bg-risk-foreground/10 blur-xl" aria-hidden="true" />
              <span className="relative grid size-11 place-items-center rounded-full bg-risk-foreground/15"><LifeBuoy className="size-5" /></span>
              <div className="relative flex-1">
                <p className="font-display font-semibold">Emergency SOS</p>
                <p className="text-xs opacity-90">Call 112, share a location or contact someone</p>
              </div>
              <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* RECENT */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent trips</h2>
            <Link to="/recent-trips" className="text-xs font-medium text-primary hover:underline">See history</Link>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {history.slice(0, 6).map((h) => {
              const b = h.routes.find((r) => topRouteNumbers(h.routes).has(r.routeNumber)) ?? h.routes[0];
              return (
                <Link
                  key={h.id}
                  to="/routes"
                  onClick={() => analysisStore.open(h.id)}
                  className="card-hover min-w-[240px] flex-1 rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between">
                    <Compass className="size-4 text-primary" />
                    <SourceBadge source={h.source} />
                    <IndexPill value={b?.safetyIndex ?? null} showLabel={false} />
                  </div>
                  <p className="mt-3 truncate text-sm font-medium">{h.origin.label.split(",")[0]} → {h.destination.label.split(",")[0]}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString([], { day: "numeric", month: "short" })} · {h.routes.length} routes</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", className)}>{children}</span>;
}

function useCountUp(target: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

function Metric({ icon: Icon, label, value, sub, tone }: { icon: typeof Store; label: string; value: number; sub: string; tone: "primary" | "safe" | "risk" | "moderate" }) {
  const v = useCountUp(value);
  const tones = {
    primary: "bg-primary-soft text-primary",
    safe: "bg-safe-soft text-safe",
    risk: "bg-risk-soft text-risk",
    moderate: "bg-moderate-soft text-moderate-foreground dark:text-moderate",
  };
  return (
    <div className="card-hover rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}><Icon className="size-4" /></span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{v}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
