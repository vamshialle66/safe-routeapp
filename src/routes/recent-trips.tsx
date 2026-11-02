import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, History, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { IndexPill } from "@/components/route/IndexPill";
import { SourceBadge } from "@/components/route/Disclaimer";
import { analysisStore, useHistory } from "@/lib/analysisStore";
import { TRAVEL_MODES, topRouteNumbers } from "@/lib/saferouteApi";

export const Route = createFileRoute("/recent-trips")({
  head: () => ({
    meta: [
      { title: "Route History — SafeRoute" },
      { name: "description", content: "Trips you've analysed recently, ready to reopen and compare again." },
      { property: "og:title", content: "Route History — SafeRoute" },
      { property: "og:description", content: "Your recently analysed trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const history = useHistory();
  const navigate = useNavigate();
  return (
    <AppLayout
      title="Route History"
      description="Your last eight analysed trips, kept on this device."
      actions={history.length > 0 && <Button variant="outline" onClick={() => analysisStore.clearHistory()}><Trash2 className="size-4" /> Clear</Button>}
    >
      {history.length === 0 ? (
        <EmptyState icon={History} title="No trips yet" description="Analysed trips will be listed here." action={<Button asChild><Link to="/route-planner">Plan a route</Link></Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {history.map((h) => {
            const best = h.routes.find((r) => topRouteNumbers(h.routes).has(r.routeNumber));
            return (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => {
                    analysisStore.open(h.id);
                    navigate({ to: "/routes" });
                  }}
                  className="w-full rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</span>
                    <SourceBadge source={h.source} />
                  </div>
                  <p className="mt-2 truncate font-medium">{h.origin.label.split(",")[0]} → {h.destination.label.split(",")[0]}</p>
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{TRAVEL_MODES.find((m) => m.value === h.travelMode)?.label}</span>·<span>{h.routes.length} routes</span>
                    <span className="ml-auto flex items-center gap-2">Best <IndexPill value={best?.safetyIndex ?? null} showLabel={false} /><ArrowRight className="size-3.5" /></span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
}
