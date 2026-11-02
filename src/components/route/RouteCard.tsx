import { Clock, Route as RouteIcon, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { formatKm, formatMin, RISK_STYLES } from "@/lib/risk";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/safety/RiskBadge";
import { SafetyScore } from "@/components/safety/SafetyScore";
import type { RouteOption } from "@/types";

interface RouteCardProps {
  route: RouteOption;
  selected?: boolean;
  onSelect?: (route: RouteOption) => void;
  className?: string;
  compact?: boolean;
}

export function RouteCard({ route, selected, onSelect, className, compact }: RouteCardProps) {
  return (
    <article
      className={cn(
        "group relative rounded-2xl border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        route.recommended ? "border-primary/40 ring-1 ring-primary/15" : "border-border",
        selected && "border-primary ring-2 ring-primary/25",
        className,
      )}
    >
      {route.recommended && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground shadow-soft">
          <Sparkles className="size-3" aria-hidden="true" />
          Recommended
        </span>
      )}

      <div className="flex items-start gap-5">
        <SafetyScore score={route.safetyScore} label={route.scoreLabel} size={compact ? "sm" : "md"} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold">{route.name}</h3>
            <RiskBadge risk={route.risk} size="sm" />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <RouteIcon className="size-4" aria-hidden="true" />
              {formatKm(route.distanceKm)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {formatMin(route.durationMin)}
            </span>
            <span className={cn("inline-flex items-center gap-1.5", RISK_STYLES[route.risk].text)}>
              <ShieldCheck className="size-4" aria-hidden="true" />
              {route.riskSegmentCount} risk segment{route.riskSegmentCount === 1 ? "" : "s"}
            </span>
          </div>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {route.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1 min-w-[7rem]">
          <Link to="/routes/$id" params={{ id: route.id }}>
            View Details
          </Link>
        </Button>
        <Button
          size="sm"
          variant={route.recommended ? "default" : "secondary"}
          className="flex-1 min-w-[7rem]"
          onClick={() => onSelect?.(route)}
        >
          {selected ? "Selected" : "Select Route"}
        </Button>
      </div>
    </article>
  );
}
