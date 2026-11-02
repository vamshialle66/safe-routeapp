import { cn } from "@/lib/utils";
import { formatIndex, indexTone, type IndexTone } from "@/lib/saferouteApi";

export const TONE_CLASSES: Record<IndexTone, { chip: string; text: string; bar: string; label: string }> = {
  safe: { chip: "bg-safe-soft text-safe border-safe/30", text: "text-safe", bar: "bg-safe", label: "Mostly open" },
  moderate: { chip: "bg-moderate-soft text-moderate-foreground dark:text-moderate border-moderate/40", text: "text-moderate", bar: "bg-moderate", label: "Some open, some closed" },
  risk: { chip: "bg-risk-soft text-risk border-risk/30", text: "text-risk", bar: "bg-risk", label: "Mostly closed" },
  none: { chip: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground", bar: "bg-muted-foreground/40", label: "Not enough data" },
};

export function IndexPill({ value, className, showLabel = true }: { value: number | null | undefined; className?: string; showLabel?: boolean }) {
  const tone = indexTone(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", TONE_CLASSES[tone].chip, className)}>
      <span className={cn("size-1.5 rounded-full", TONE_CLASSES[tone].bar)} aria-hidden="true" />
      {formatIndex(value)}
      {showLabel && <span className="opacity-80">· {TONE_CLASSES[tone].label}</span>}
    </span>
  );
}

/** Ring gauge for a 0-100 index; N/A shows a dashed ring. */
export function IndexRing({ value, size = 72 }: { value: number | null | undefined; size?: number }) {
  const tone = indexTone(value);
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-muted" strokeDasharray={value == null ? "2 2" : undefined} />
        <circle
          cx="18" cy="18" r={r} fill="none" strokeWidth="3" strokeLinecap="round"
          className={cn("transition-all duration-700", tone === "safe" ? "stroke-safe" : tone === "moderate" ? "stroke-moderate" : "stroke-risk")}
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <span className={cn("font-display font-semibold", size > 60 ? "text-lg" : "text-sm", TONE_CLASSES[tone].text)}>{formatIndex(value)}</span>
    </div>
  );
}
