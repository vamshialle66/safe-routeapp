import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { formatKm, formatMin, RISK_STYLES, scoreToneClass } from "@/lib/risk";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/safety/RiskBadge";
import type { RouteOption } from "@/types";

interface Props {
  routes: RouteOption[];
  selectedId?: string;
  onSelect?: (route: RouteOption) => void;
}

export function RouteComparison({ routes, selectedId, onSelect }: Props) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Comparison of generated routes by safety and travel metrics</caption>
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Route", "Safety Score", "Distance", "ETA", "Risk Level", "Lighting", "Public Activity", "Risk Segments", ""].map(
                (h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr
                key={route.id}
                className={cn(
                  "border-t border-border transition-colors hover:bg-secondary/60",
                  selectedId === route.id && "bg-primary-soft/60",
                )}
              >
                <th scope="row" className="px-4 py-4 text-left font-medium">
                  <Link to="/routes/$id" params={{ id: route.id }} className="hover:underline">
                    {route.name}
                  </Link>
                  {route.recommended && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                      Recommended
                    </span>
                  )}
                </th>
                <td className="px-4 py-4">
                  <span className={cn("font-display text-2xl font-semibold", scoreToneClass(route.safetyScore))}>
                    {route.safetyScore}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">/ 100</span>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{formatKm(route.distanceKm)}</td>
                <td className="px-4 py-4 text-muted-foreground">{formatMin(route.durationMin)}</td>
                <td className="px-4 py-4">
                  <RiskBadge risk={route.risk} size="sm" />
                </td>
                <td className="px-4 py-4">{route.factors.lighting}%</td>
                <td className="px-4 py-4">{route.factors.publicActivity}%</td>
                <td className={cn("px-4 py-4 font-medium", RISK_STYLES[route.risk].text)}>
                  {route.riskSegmentCount}
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    size="sm"
                    variant={selectedId === route.id ? "default" : "outline"}
                    onClick={() => onSelect?.(route)}
                  >
                    {selectedId === route.id ? "Selected" : "Select"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked comparison */}
      <div className="grid gap-4 lg:hidden">
        {routes.map((route) => (
          <div
            key={route.id}
            className={cn(
              "rounded-2xl border bg-card p-4 shadow-soft",
              selectedId === route.id ? "border-primary ring-2 ring-primary/20" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold">{route.name}</p>
                <RiskBadge risk={route.risk} size="sm" className="mt-1.5" />
              </div>
              <div className="text-right">
                <p className={cn("font-display text-3xl font-semibold leading-none", scoreToneClass(route.safetyScore))}>
                  {route.safetyScore}
                </p>
                <p className="text-[11px] text-muted-foreground">Safety score</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Distance", formatKm(route.distanceKm)],
                ["ETA", formatMin(route.durationMin)],
                ["Lighting", `${route.factors.lighting}%`],
                ["Public activity", `${route.factors.publicActivity}%`],
                ["Risk segments", String(route.riskSegmentCount)],
                ["Road conditions", `${route.factors.roadConditions}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-secondary px-3 py-2">
                  <dt className="text-[11px] text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/routes/$id" params={{ id: route.id }}>
                  Details
                </Link>
              </Button>
              <Button
                size="sm"
                className="flex-1"
                variant={selectedId === route.id ? "default" : "secondary"}
                onClick={() => onSelect?.(route)}
              >
                {selectedId === route.id ? "Selected" : "Select"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
