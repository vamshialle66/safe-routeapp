import { useState } from "react";
import { fetchNearby } from "@/lib/runAnalysis";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crosshair, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { MiniHero } from "@/components/layout/MiniHero";
import { RouteMap } from "@/components/map/RouteMap";
import { Button } from "@/components/ui/button";
import { IndexRing } from "@/components/route/IndexPill";
import { Disclaimer, SourceBadge } from "@/components/route/Disclaimer";
import { currentPosition, SAMPLE_ORIGIN } from "@/lib/geocode";
import { type LatLng, type NearbyResponse } from "@/lib/saferouteApi";
import { demoNearby } from "@/lib/demoAnalysis";
import { cn } from "@/lib/utils";
import { requireLiveData } from "@/lib/liveDataPolicy";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/safety-map")({
  head: () => ({
    meta: [
      { title: "Around Me — SafeRoute" },
      { name: "description", content: "See which places near you are open right now." },
      { property: "og:title", content: "Around Me — SafeRoute" },
      { property: "og:description", content: "Open places near your location." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SafetyMapPage,
});

function SafetyMapPage() {
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [center, setCenter] = useState<LatLng | undefined>();
  const [data, setData] = useState<NearbyResponse | null>(null);
  const [source, setSource] = useState<"live" | "demo">("live");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "help">("all");

  async function scan(useSample = false) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const p = useSample ? SAMPLE_ORIGIN : await currentPosition();
      setCenter(p);
      if (useSample) {
        setSource("demo");
        setData(demoNearby(p));
      } else {
        setData(requireLiveData(await fetchNearby(p)));
        setSource("live");
      }
      setCheckedAt(new Date().toLocaleString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load nearby places.");
      toast.error(e instanceof Error ? e.message : "Couldn't load places");
    } finally {
      setLoading(false);
    }
  }

  const HELP_TYPES = new Set(["police", "hospital", "doctor", "pharmacy", "fire_station"]);
  const places = (data?.places ?? []).filter((p) =>
    filter === "all" ? true : filter === "open" ? p.openNow === true : (p.types ?? []).some((t) => HELP_TYPES.has(t)));

  return (
    <AppLayout title="Around Me" fullBleed>
      <MiniHero className="m-4 mb-0 lg:hidden" title="Around Me" description="Find nearby shops, pharmacies, ATMs and other services, and check their opening status." />
      <div className="flex flex-col pt-4 lg:h-[calc(100vh-4rem)] lg:flex-row lg:pt-0">
        <aside className="order-2 w-full space-y-4 border-r border-border bg-card p-5 lg:order-1 lg:w-[380px] lg:overflow-y-auto">
          <MiniHero className="hidden lg:block" title="Around Me" description="Find nearby shops, pharmacies, ATMs and other services, and check their opening status." />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => scan()} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />} Find nearby places
            </Button>
          </div>
          {!session.user && session.ready && <p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary underline">Sign in</Link> to search real nearby places.</p>}
          <Button variant="ghost" size="sm" onClick={() => scan(true)} disabled={loading}>View example places</Button>
          {error && <p role="alert" className="border-l-2 border-risk pl-3 text-sm">{error} No example places have been substituted.</p>}
          {data && (
            <>
              <p className="text-xs text-muted-foreground">{source === "demo" ? "Invented example places — do not travel to these locations." : `Google Maps · checked ${checkedAt}. Opening hours may change; confirm before travelling.`}</p>
              <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
                <IndexRing value={data.safetyIndex} />
                <div className="flex-1">
                  <p className="font-semibold">{data.openPlaceCount} of {data.scoredPlaceCount} open</p>
                  <p className="text-xs text-muted-foreground">{data.places.length} places found nearby</p>
                </div>
                <SourceBadge source={source} />
              </div>
              <div className="flex gap-1.5">
                {(["all", "open", "help"] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setFilter(f)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                    {f === "all" ? "All places" : f === "open" ? "Open now" : "Help spots"}
                  </button>
                ))}
              </div>
              <ul className="space-y-2">
                {!places.length && <li className="py-4 text-sm text-muted-foreground">{data.places.length ? "None of the returned places is reported open." : "No places were returned for this search. This doesn't mean no help is available nearby."}</li>}
                {places.map((p, i) => (
                  <li key={p.id ?? i} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-secondary"><Store className="size-4 text-muted-foreground" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">{(p.types?.[0] ?? "place").replace(/_/g, " ")}</p>
                    </div>
                    <span className={cn("text-xs font-medium", p.openNow === true ? "text-safe" : p.openNow === false ? "text-risk" : "text-muted-foreground")}>
                      {p.openNow === true ? "Open" : p.openNow === false ? "Closed" : "Hours unknown"}
                    </span>
                    {source === "live" && <Button asChild variant="outline" size="sm" className="min-h-10"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.latitude},${p.longitude}`)}${p.id ? `&query_place_id=${encodeURIComponent(p.id)}` : ""}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.name} in Google Maps`}>Maps</a></Button>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <Disclaimer />
        </aside>
        <section className="relative order-1 h-[45vh] min-h-[300px] flex-none sm:h-[50vh] lg:flex-1 lg:order-2 lg:h-auto">
          <RouteMap center={center} places={places} />
        </section>
      </div>
    </AppLayout>
  );
}
