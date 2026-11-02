import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { IndexPill } from "@/components/route/IndexPill";
import { analysisStore, useHistory, useSaved } from "@/lib/analysisStore";
import { formatDistance, formatDuration } from "@/lib/saferouteApi";

export const Route = createFileRoute("/saved-routes")({
  head: () => ({
    meta: [
      { title: "Saved Routes — SafeRoute" },
      { name: "description", content: "Routes you've bookmarked for regular journeys." },
      { property: "og:title", content: "Saved Routes — SafeRoute" },
      { property: "og:description", content: "Your bookmarked routes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const saved = useSaved();
  const history = useHistory();
  const navigate = useNavigate();
  return (
    <AppLayout title="Saved Routes" description="Bookmark routes from any analysis to find them quickly.">
      {saved.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved routes" description="Tap Save on any route to keep it here." action={<Button asChild><Link to="/route-planner">Plan a route</Link></Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => {
            const a = s.analysis ?? history.find((h) => h.id === s.analysisId);
            const r = a?.routes.find((x) => x.routeNumber === s.routeNumber);
            return (
              <li key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{s.name}</p>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Remove" onClick={() => analysisStore.removeSaved(s.id)}><Trash2 className="size-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">Route {s.routeNumber} · saved {new Date(s.savedAt).toLocaleDateString()}</p>
                {r ? (
                  <>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <IndexPill value={r.safetyIndex} showLabel={false} />
                      <span className="text-muted-foreground">{formatDistance(r.distanceMeters)} · {formatDuration(r.duration)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => {
                        analysisStore.openSaved(s);
                        navigate({ to: "/routes/$id", params: { id: String(s.routeNumber) } });
                      }}
                    >
                      Open details
                    </Button>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Details expired — plan this trip again for fresh data.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
}
