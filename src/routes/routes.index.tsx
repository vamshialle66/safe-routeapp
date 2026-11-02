import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Map } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { IndexPill } from "@/components/route/IndexPill";
import { Disclaimer, SourceBadge } from "@/components/route/Disclaimer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentAnalysis } from "@/lib/analysisStore";
import { durationSeconds, formatDistance, formatDuration, indexTone, topRouteNumbers } from "@/lib/saferouteApi";

export const Route = createFileRoute("/routes/")({
  head: () => ({
    meta: [
      { title: "Compare Routes — SafeRoute" },
      { name: "description", content: "Compare your route options by nearby open places, travel time and distance." },
      { property: "og:title", content: "Compare Routes — SafeRoute" },
      { property: "og:description", content: "Compare alternative routes side by side." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const a = useCurrentAnalysis();
  if (!a || !a.routes.length) {
    return (
      <AppLayout title="Compare routes">
        <EmptyState icon={Map} title="Nothing to compare yet" description="Choose a start and destination in Plan Route to see your options here." action={<Button asChild><Link to="/route-planner">Plan a route</Link></Button>} />
      </AppLayout>
    );
  }
  const best = topRouteNumbers(a.routes);
  const fastest = Math.min(...a.routes.map((r) => durationSeconds(r.duration)));
  const data = a.routes.map((r) => ({ name: `Route ${r.routeNumber}`, comparison: r.assessment?.score ?? null, minutes: Math.round(durationSeconds(r.duration) / 60) }));

  return (
    <AppLayout
      title="Compare routes"
      description={`${a.origin.label.split(",")[0]} → ${a.destination.label.split(",")[0]} · ${new Date(a.createdAt).toLocaleString()}`}
      actions={<SourceBadge source={a.source} />}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Open-places score</TableHead>
                <TableHead>Comparison score</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Travel time</TableHead>
                <TableHead className="hidden md:table-cell">Opening hours available</TableHead>
                <TableHead className="hidden md:table-cell">Fewer open places</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.routes.map((r) => (
                <TableRow key={r.routeNumber} className={best.has(r.routeNumber) ? "bg-safe-soft/50" : ""}>
                  <TableCell className="font-medium">
                    Route {r.routeNumber}
                    {best.has(r.routeNumber) && <span className="ml-2 text-[10px] font-semibold uppercase text-safe">{r.assessment ? "Higher comparison score" : "Most open places"}</span>}
                    {durationSeconds(r.duration) === fastest && <span className="ml-2 text-[10px] font-semibold uppercase text-primary">Fastest</span>}
                  </TableCell>
                  <TableCell><IndexPill value={r.safetyIndex} showLabel={false} /></TableCell>
                  <TableCell>{r.assessment?.score == null ? "Not available" : `${r.assessment.score}/100`}<p className="mt-1 text-xs text-muted-foreground">{r.assessment ? `${r.assessment.helpPlaces.length} help locations open` : "Plan again to check"}</p></TableCell>
                  <TableCell>{formatDistance(r.distanceMeters)}</TableCell>
                  <TableCell>{formatDuration(r.duration)}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.distanceMeters ? Math.round(r.scoredLengthMeters / r.distanceMeters * 100) : 0}% of route</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDistance(r.segments.filter((s) => indexTone(s.safetyIndex) === "risk").reduce((total, s) => total + s.lengthMeters, 0))}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/routes/$id" params={{ id: String(r.routeNumber) }}>View <ArrowRight className="size-3.5" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-4">
          <div className="border-y border-border py-4"><h2 className="font-semibold">Why these routes rank differently</h2><p className="mt-2 text-sm text-muted-foreground">The comparison considers the number of observed open places and nearby open help services. It needs opening-hour information near at least half the journey. Crime and street lighting are not verified; this is not a safety rating.</p></div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Comparison score vs travel time</h2>
            <p className="mt-2 text-sm text-muted-foreground">Higher scores mean more open places and help services were found nearby. Routes without enough information have no score bar. This is not a safety rating.</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} width={28} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Bar dataKey="comparison" name="Comparison score" fill="var(--safe)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minutes" name="Minutes" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <Disclaimer />
        </div>
      </div>
    </AppLayout>
  );
}
