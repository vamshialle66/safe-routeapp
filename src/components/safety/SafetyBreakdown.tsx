import { cn } from "@/lib/utils";
import { FACTOR_LABELS } from "@/services/safetyService";
import type { SafetyFactors } from "@/types";

const ORDER: (keyof SafetyFactors)[] = [
  "lighting",
  "publicActivity",
  "crimeRisk",
  "roadConditions",
  "safeLocations",
];

function toneFor(value: number) {
  if (value >= 85) return "bg-safe";
  if (value >= 65) return "bg-moderate";
  return "bg-risk";
}

export function SafetyBreakdown({
  factors,
  className,
  compact = false,
}: {
  factors: SafetyFactors;
  className?: string;
  compact?: boolean;
}) {
  return (
    <dl className={cn("space-y-3.5", className)}>
      {ORDER.map((key) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <dt className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
              {FACTOR_LABELS[key]}
            </dt>
            <dd className={cn("font-display font-semibold", compact ? "text-sm" : "text-base")}>
              {factors[key]}%
            </dd>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="meter"
            aria-valuenow={factors[key]}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={FACTOR_LABELS[key]}
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-700", toneFor(factors[key]))}
              style={{ width: `${factors[key]}%` }}
            />
          </div>
        </div>
      ))}
    </dl>
  );
}
