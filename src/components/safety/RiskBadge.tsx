import { cn } from "@/lib/utils";
import { RISK_LABELS, RISK_STYLES } from "@/lib/risk";
import type { RiskLevel } from "@/types";

export function RiskBadge({
  risk,
  className,
  size = "md",
}: {
  risk: RiskLevel;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        RISK_STYLES[risk].chip,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", RISK_STYLES[risk].dot)} aria-hidden="true" />
      {RISK_LABELS[risk]}
    </span>
  );
}
