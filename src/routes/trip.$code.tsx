import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag, MapPin, Radio } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteMap } from "@/components/map/RouteMap";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getSharedTripFn } from "@/lib/sharedTrips.functions";
import { formatDistance, formatDuration } from "@/lib/saferouteApi";

export const Route = createFileRoute("/trip/$code")({
  head: () => ({
    meta: [
      { title: "Follow a live trip — SafeRoute" },
      { name: "description", content: "Someone you trust is sharing their journey with you live until they arrive." },
      { property: "og:title", content: "Follow a live trip — SafeRoute" },
      { property: "og:description", content: "Watch this journey live until they arrive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WatchTripPage,
});

interface Trip {
  shareCode: string;
  travelerName: string | null;
  originLabel: string;
  destinationLabel: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  routePolyline: string | null;
  routeDistanceMeters: number | null;
  routeDurationSeconds: number | null;
  status: "active" | "arrived" | "ended";
  current: { latitude: number; longitude: number } | null;
  lastUpdateAt: string | null;
  createdAt: string;
}

function WatchTripPage() {
  const { code } = Route.useParams();
  const getTrip = useServerFn(getSharedTripFn);
  const [live, setLive] = useState<Trip | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shared-trip", code],
    queryFn: () => getTrip({ data: { shareCode: code } }),
    refetchInterval: 5000,
  });

  const outcome = data && !data.found ? data.outcome : null;
  const trip = outcome ? null : live ?? (data?.found ? data.trip : null);

  // Realtime: position updates arrive instantly without waiting for the poll.
  useEffect(() => {
    const channel = supabase
      .channel(`trip-${code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shared_trips", filter: `share_code=eq.${code}` },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          setLive((prev) =>
            prev
              ? {
                  ...prev,
                  status: r["status"] as Trip["status"],
                  current:
                    r["current_lat"] != null && r["current_lng"] != null
                      ? { latitude: r["current_lat"] as number, longitude: r["current_lng"] as number }
                      : prev.current,
                  lastUpdateAt: (r["last_update_at"] as string | null) ?? null,
                }
              : prev,
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [code]);

  useEffect(() => {
    if (data?.found) setLive(data.trip);
  }, [data]);

  if (isLoading) {
    return <AppLayout title="Live trip"><div className="h-64 animate-pulse rounded-2xl bg-muted" /></AppLayout>;
  }

  if (!trip && outcome) {
    const who = outcome.travelerName ?? "The person you were following";
    const isArrived = outcome.status === "arrived";
    return (
      <AppLayout title={isArrived ? `${who} has arrived` : "Trip ended"}>
        <div className={`rounded-2xl border p-6 text-center ${isArrived ? "border-safe/40 bg-safe/10" : "border-border bg-card"}`}>
          {isArrived ? <Flag className="mx-auto size-8 text-safe" /> : <MapPin className="mx-auto size-8 text-muted-foreground" />}
          <p className={`mt-3 font-display text-lg font-semibold ${isArrived ? "text-safe" : ""}`}>
            {isArrived ? `${who} arrived safely` : `${who} ended the trip`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArrived ? "They marked themselves as arrived" : "They stopped sharing before marking arrival"}
            {outcome.endedAt ? ` at ${new Date(outcome.endedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}.
            {" "}Their location is no longer shared.
          </p>
          {!isArrived && <p className="mt-2 text-xs text-muted-foreground">If you're worried, call them to check they're okay.</p>}
          <Button asChild className="mt-4" variant="outline"><Link to="/">Open SafeRoute</Link></Button>
        </div>
      </AppLayout>
    );
  }

  if (!trip) {
    return (
      <AppLayout title="Live trip">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <MapPin className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">This trip link isn't active</p>
          <p className="mt-1 text-sm text-muted-foreground">The trip may have ended, or the link is incorrect. Ask the person travelling to share a fresh link.</p>
          <Button asChild className="mt-4" variant="outline"><Link to="/">Open SafeRoute</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const arrived = trip.status === "arrived";
  const ended = trip.status === "ended";
  const lastUpdate = trip.lastUpdateAt ? new Date(trip.lastUpdateAt) : null;
  const staleMinutes = lastUpdate ? Math.round((Date.now() - lastUpdate.getTime()) / 60000) : null;

  return (
    <AppLayout
      title={trip.travelerName
        ? arrived ? `${trip.travelerName} has arrived` : ended ? `${trip.travelerName}'s trip ended` : `This is ${trip.travelerName}'s live trip`
        : arrived ? "They've arrived" : ended ? "Trip ended" : "Following live"}
      description={`${trip.travelerName && !arrived && !ended ? `${trip.travelerName} is travelling from ` : ""}${friendlyPlace(trip.originLabel, trip.travelerName, "starting point")} → ${friendlyPlace(trip.destinationLabel, trip.travelerName, "destination")}${trip.routeDistanceMeters ? ` · ${formatDistance(trip.routeDistanceMeters)}` : ""}${trip.routeDurationSeconds ? ` · about ${formatDuration(`${trip.routeDurationSeconds}s`)}` : ""}`}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="relative h-[320px] sm:h-[420px] overflow-hidden rounded-2xl border border-border">
          <RouteMap
            origin={trip.origin}
            destination={trip.destination}
            routePolyline={trip.routePolyline}
            livePosition={trip.current ?? undefined}
            showPlaces={false}
          />
        </div>
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 ${arrived ? "border-safe/40 bg-safe/10" : ended ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
            {arrived ? (
              <p className="flex items-center gap-2 font-display font-semibold text-safe"><Flag className="size-4" /> Arrived safely</p>
            ) : ended ? (
              <p className="font-display font-semibold">This trip has ended</p>
            ) : (
              <p className="flex items-center gap-2 font-display font-semibold text-primary"><Radio className="size-4 animate-pulse" /> Live</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {arrived
                ? `${trip.travelerName ?? "The person you're following"} marked themselves as arrived.`
                : ended
                  ? "Live position sharing has stopped."
                  : trip.current
                    ? `Position updated ${staleMinutes != null && staleMinutes >= 1 ? `${staleMinutes} min ago` : "just now"}. This page updates automatically.`
                    : "Waiting for their first position update…"}
            </p>
            {!arrived && !ended && staleMinutes != null && staleMinutes >= 5 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">No update for {staleMinutes} minutes — their phone may have lost signal or the page may be closed.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Shared via SafeRoute. Positions are only visible while the trip is active and disappear when it ends.</p>
        </div>
      </div>
    </AppLayout>
  );
}

// "My current location" makes sense to the traveller, not to the follower.
function friendlyPlace(label: string, name: string | null, kind: "starting point" | "destination") {
  const first = label.split(",")[0]?.trim() ?? "";
  if (/^(my|your)\s+(current\s+)?location$/i.test(first) || !first) {
    return name ? `${name}'s ${kind}` : `their ${kind}`;
  }
  return first;
}
