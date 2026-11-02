import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Flag, MapPin, Radio, Square } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteMap } from "@/components/map/RouteMap";
import { Button } from "@/components/ui/button";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { useSession } from "@/lib/session";
import { useCurrentAnalysis } from "@/lib/analysisStore";
import { formatDistance, formatDuration } from "@/lib/saferouteApi";
import { startSharedTripFn, updateSharedTripFn, endSharedTripFn } from "@/lib/sharedTrips.functions";

type Search = { route?: number | undefined };

export const Route = createFileRoute("/trip/live")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    route: typeof s["route"] === "number" ? (s["route"] as number) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Share Live Trip — SafeRoute" },
      { name: "description", content: "Share a live link so someone you trust can follow your journey until you arrive." },
      { property: "og:title", content: "Share Live Trip — SafeRoute" },
      { property: "og:description", content: "Let someone you trust follow your journey live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveTripPage,
});

function LiveTripPage() {
  const { route: routeParam } = Route.useSearch();
  const { user, ready } = useSession();
  const analysis = useCurrentAnalysis();
  const route = analysis?.routes.find((r) => r.routeNumber === (routeParam ?? 1)) ?? analysis?.routes[0];

  const [shareCode, setShareCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [finished, setFinished] = useState<"arrived" | "ended" | null>(null);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  const shareUrl = shareCode ? `${window.location.origin}/trip/${shareCode}` : null;

  const stopWatch = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  useEffect(() => stopWatch, [stopWatch]);

  async function startTrip() {
    if (!analysis || !route) return;
    setStarting(true);
    try {
      const { shareCode: code } = await startSharedTripFn({
        data: {
          originLabel: analysis.origin.label,
          destinationLabel: analysis.destination.label,
          originLat: analysis.origin.latitude,
          originLng: analysis.origin.longitude,
          destinationLat: analysis.destination.latitude,
          destinationLng: analysis.destination.longitude,
          routePolyline: route.encodedPolyline ?? null,
          routeDistanceMeters: route.distanceMeters ?? null,
          routeDurationSeconds: route.duration ? Math.round(parseFloat(route.duration)) : null,
        },
      });
      setShareCode(code);
      setFinished(null);
      if (!navigator.geolocation) {
        setGpsError("This device can't share its position. The link still works, but won't show live movement.");
        return;
      }
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const p = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setPosition(p);
          void updateSharedTripFn({ data: { shareCode: code, lat: p.latitude, lng: p.longitude } }).catch(() => {});
        },
        () => setGpsError("Location permission was denied. Allow location access so followers can see you move."),
        { enableHighAccuracy: true, maximumAge: 5000 },
      );
      toast.success("Live trip started — share the link with someone you trust");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start the trip");
    } finally {
      setStarting(false);
    }
  }

  async function endTrip(arrived: boolean) {
    if (!shareCode) return;
    stopWatch();
    try {
      await endSharedTripFn({ data: { shareCode, arrived } });
      toast.success(arrived ? "Marked as arrived — followers have been notified" : "Trip ended — the link no longer shows your position");
      setShareCode(null);
      setPosition(null);
      setFinished(arrived ? "arrived" : "ended");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't end the trip");
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: "Follow my trip", text: "Follow my journey live on SafeRoute", url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied — send it to someone you trust");
      }
    } catch { /* cancelled */ }
  }

  if (!ready) return <AppLayout title="Share live trip"><div className="h-40 animate-pulse rounded-2xl bg-muted" /></AppLayout>;

  if (!user) {
    return (
      <AppLayout title="Share live trip" description="Let someone you trust follow your journey until you arrive.">
        <SignInPrompt text="Sign in to start a live trip and share the link. People you share with don't need an account." />
      </AppLayout>
    );
  }

  if (!analysis || !route) {
    return (
      <AppLayout title="Share live trip" description="Let someone you trust follow your journey until you arrive.">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <MapPin className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Plan a route first</p>
          <p className="mt-1 text-sm text-muted-foreground">A live trip follows a real route you've planned, so followers see the path you intend to take.</p>
          <Button asChild className="mt-4"><Link to="/route-planner">Plan a route</Link></Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Share live trip"
      description={`${analysis.origin.label.split(",")[0]} → ${analysis.destination.label.split(",")[0]} · ${formatDistance(route.distanceMeters)} · about ${formatDuration(route.duration)}`}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="relative h-[320px] sm:h-[420px] overflow-hidden rounded-2xl border border-border">
          <RouteMap
            origin={analysis.origin}
            destination={analysis.destination}
            routePolyline={route.encodedPolyline ?? null}
            livePosition={position ?? undefined}
            showPlaces={false}
          />
        </div>

        <div className="space-y-4">
          {!shareCode && finished ? (
            <div className={`rounded-2xl border p-5 ${finished === "arrived" ? "border-safe/40 bg-safe/10" : "border-border bg-card"}`}>
              <p className={`font-display font-semibold ${finished === "arrived" ? "text-safe" : ""}`}>
                {finished === "arrived" ? "You've arrived — trip complete" : "Trip ended"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {finished === "arrived"
                  ? "People following your link now see that you arrived safely."
                  : "People following your link now see that you ended the trip. Your location is no longer shared."}
              </p>
              <Button className="mt-4" variant="outline" onClick={() => setFinished(null)}>Start another trip</Button>
            </div>
          ) : !shareCode ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold">How it works</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Start the trip — we create a private link.</li>
                <li>Send the link to someone you trust. They don't need an account.</li>
                <li>They watch your position move along this route until you tap "I've arrived".</li>
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">Only people with the link can see your position. The link stops working the moment you end the trip.</p>
              <Button className="mt-4 w-full" size="lg" onClick={() => void startTrip()} disabled={starting}>
                <Radio className="size-4" /> {starting ? "Starting…" : "Start live trip"}
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-safe/40 bg-safe/10 p-5">
                <p className="flex items-center gap-2 font-display font-semibold text-safe"><Radio className="size-4 animate-pulse" /> Live now</p>
                <p className="mt-2 text-sm text-muted-foreground">{position ? "Your position is being shared." : "Waiting for your first position…"}</p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-background/60 p-2">
                  <code className="flex-1 truncate text-xs">{shareUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => void copyLink()}><Copy className="size-3.5" /> Share link</Button>
                </div>
                {gpsError && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{gpsError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button size="lg" className="bg-safe text-safe-foreground hover:bg-safe/90" onClick={() => void endTrip(true)}>
                  <Flag className="size-4" /> I've arrived
                </Button>
                <Button size="lg" variant="outline" onClick={() => void endTrip(false)}>
                  <Square className="size-4" /> End trip
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Keep this page open while you travel so your position keeps updating.</p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
