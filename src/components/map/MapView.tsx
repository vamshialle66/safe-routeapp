import { useMemo, useState } from "react";
import { Crosshair, Layers, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RISK_STYLES } from "@/lib/risk";
import type { RiskLevel, RouteOption, SafePlace } from "@/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Mock map renderer.
 *
 * This component is the single map abstraction in the app. When a real
 * provider (Google Maps) is connected, replace the internals here and keep
 * the same props contract — no consumer needs to change.
 */
export interface MapViewProps {
  routes?: RouteOption[];
  activeRouteId?: string;
  onRouteSelect?: (id: string) => void;
  safePlaces?: SafePlace[];
  onPlaceSelect?: (place: SafePlace) => void;
  showRiskZones?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  originLabel?: string;
  destinationLabel?: string;
  className?: string;
  interactive?: boolean;
}

const RISK_ZONES: { id: string; risk: RiskLevel; cx: number; cy: number; r: number }[] = [
  { id: "z1", risk: "low", cx: 26, cy: 66, r: 16 },
  { id: "z2", risk: "low", cx: 78, cy: 24, r: 14 },
  { id: "z3", risk: "moderate", cx: 52, cy: 52, r: 13 },
  { id: "z4", risk: "high", cx: 62, cy: 72, r: 10 },
];

const ZONE_FILL: Record<RiskLevel, string> = {
  low: "fill-safe/12",
  moderate: "fill-moderate/16",
  high: "fill-risk/16",
};

const ROUTE_STROKE: Record<RiskLevel, string> = {
  low: "stroke-safe",
  moderate: "stroke-moderate",
  high: "stroke-risk",
};

function toPath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

export function MapView({
  routes = [],
  activeRouteId,
  onRouteSelect,
  safePlaces = [],
  onPlaceSelect,
  showRiskZones = true,
  showLegend = true,
  showControls = true,
  originLabel = "Current Location",
  destinationLabel = "Destination",
  className,
  interactive = true,
}: MapViewProps) {
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState(true);

  const active = useMemo(
    () => routes.find((r) => r.id === activeRouteId) ?? routes[0],
    [routes, activeRouteId],
  );

  const origin = active?.path[0] ?? { x: 14, y: 82 };
  const destination = active?.path[active.path.length - 1] ?? { x: 86, y: 18 };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-secondary",
        className,
      )}
    >
      <div
        className="absolute inset-0 origin-center transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        <svg viewBox="0 0 100 100" className="size-full" preserveAspectRatio="none">
          {/* base land */}
          <rect width="100" height="100" className="fill-secondary" />
          {/* water */}
          <path d="M0 88 C 20 80, 34 96, 52 90 C 70 84, 84 96, 100 90 L100 100 L0 100 Z" className="fill-primary/10" />
          {/* park blocks */}
          <rect x="60" y="4" width="22" height="14" rx="3" className="fill-safe/10" />
          <rect x="4" y="30" width="16" height="14" rx="3" className="fill-safe/10" />

          {/* road grid */}
          <g className="stroke-background" strokeWidth="2.6" strokeLinecap="round">
            {[12, 28, 44, 60, 76, 92].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} />
            ))}
            {[10, 26, 42, 58, 74, 90].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" />
            ))}
          </g>
          <g className="stroke-border" strokeWidth="0.4">
            {[20, 36, 52, 68, 84].map((y) => (
              <line key={`hs${y}`} x1="0" y1={y} x2="100" y2={y} />
            ))}
            {[18, 34, 50, 66, 82].map((x) => (
              <line key={`vs${x}`} x1={x} y1="0" x2={x} y2="100" />
            ))}
          </g>

          {/* risk zones */}
          {showRiskZones && layers &&
            RISK_ZONES.map((z) => (
              <circle key={z.id} cx={z.cx} cy={z.cy} r={z.r} className={ZONE_FILL[z.risk]} />
            ))}

          {/* inactive routes */}
          {routes
            .filter((r) => r.id !== active?.id)
            .map((r) => (
              <path
                key={r.id}
                d={toPath(r.path)}
                fill="none"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="3 2.5"
                className={cn(ROUTE_STROKE[r.risk], "opacity-45")}
              />
            ))}

          {/* active route, segment-colored */}
          {active &&
            active.path.slice(0, -1).map((point, i) => {
              const next = active.path[i + 1];
              const segment = active.segments[Math.min(i, active.segments.length - 1)];
              return (
                <line
                  key={`${active.id}-${i}`}
                  x1={point.x}
                  y1={point.y}
                  x2={next!.x}
                  y2={next!.y}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  className={ROUTE_STROKE[segment?.risk ?? active.risk]}
                />
              );
            })}

          {/* safe place markers */}
          {layers &&
            safePlaces.map((place) => (
              <circle
                key={place.id}
                cx={place.position.x}
                cy={place.position.y}
                r="1.5"
                className="fill-primary stroke-background"
                strokeWidth="0.7"
              />
            ))}

          {/* origin + destination */}
          <circle cx={origin.x} cy={origin.y} r="3.4" className="fill-primary/25" />
          <circle cx={origin.x} cy={origin.y} r="1.7" className="fill-primary stroke-background" strokeWidth="0.8" />
          <g transform={`translate(${destination.x} ${destination.y})`}>
            <path
              d="M0 0 c -3 -4 -4 -5.4 -4 -7.2 a 4 4 0 0 1 8 0 c 0 1.8 -1 3.2 -4 7.2 Z"
              className="fill-primary stroke-background"
              strokeWidth="0.6"
            />
            <circle cx="0" cy="-7.2" r="1.3" className="fill-background" />
          </g>
        </svg>
      </div>

      {/* route pickers */}
      {interactive && onRouteSelect && routes.length > 1 && (
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {routes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onRouteSelect(r.id)}
              aria-pressed={r.id === active?.id}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-soft transition-colors",
                r.id === active?.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {r.name} · {r.safetyScore}
            </button>
          ))}
        </div>
      )}

      {/* labels */}
      <div className="pointer-events-none absolute bottom-3 left-3 max-w-[60%] rounded-xl border border-border bg-card/90 px-3 py-2 text-xs shadow-soft backdrop-blur">
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          {originLabel}
        </p>
        <p className="mt-1 flex items-center gap-1.5 font-medium">
          <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" />
          {destinationLabel}
        </p>
      </div>

      {showControls && (
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {[
            { icon: Plus, label: "Zoom in", action: () => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2))) },
            { icon: Minus, label: "Zoom out", action: () => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2))) },
            { icon: Crosshair, label: "Recenter on current location", action: () => setZoom(1) },
            { icon: Layers, label: "Toggle safety layers", action: () => setLayers((l) => !l) },
          ].map(({ icon: Icon, label, action }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 bg-card shadow-soft"
                  onClick={action}
                  aria-label={label}
                >
                  <Icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {showLegend && (
        <div className="absolute bottom-3 right-3 rounded-xl border border-border bg-card/90 px-3 py-2 text-[11px] shadow-soft backdrop-blur">
          <p className="mb-1 font-medium">Legend</p>
          <ul className="space-y-1">
            {(["low", "moderate", "high"] as RiskLevel[]).map((risk) => (
              <li key={risk} className="flex items-center gap-1.5 text-muted-foreground">
                <span className={cn("h-0.5 w-4 rounded-full", RISK_STYLES[risk].dot)} aria-hidden="true" />
                {risk === "low" ? "Lower Risk" : risk === "moderate" ? "Moderate Risk" : "Higher Risk"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onPlaceSelect && safePlaces.length > 0 && (
        <div className="sr-only">
          {safePlaces.map((place) => (
            <button key={place.id} type="button" onClick={() => onPlaceSelect(place)}>
              {place.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
