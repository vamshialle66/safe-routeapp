import { cn } from "@/lib/utils";
import { riskFromScore, RISK_LABELS, RISK_STYLES } from "@/lib/risk";

interface SafetyScoreProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  caption?: string;
  className?: string;
}

const SIZES = {
  sm: { box: 72, stroke: 7, value: "text-lg", sub: "text-[10px]" },
  md: { box: 116, stroke: 9, value: "text-3xl", sub: "text-xs" },
  lg: { box: 168, stroke: 11, value: "text-5xl", sub: "text-sm" },
} as const;

export function SafetyScore({
  score,
  label,
  size = "md",
  caption,
  className,
}: SafetyScoreProps) {
  const cfg = SIZES[size];
  const risk = riskFromScore(score);
  const radius = (cfg.box - cfg.stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="relative"
        style={{ width: cfg.box, height: cfg.box }}
        role="img"
        aria-label={`Safety score ${score} out of 100, ${label ?? RISK_LABELS[risk]}`}
      >
        <svg viewBox={`0 0 ${cfg.box} ${cfg.box}`} className="size-full -rotate-90">
          <circle
            cx={cfg.box / 2}
            cy={cfg.box / 2}
            r={radius}
            className="stroke-border"
            strokeWidth={cfg.stroke}
            fill="none"
          />
          <circle
            cx={cfg.box / 2}
            cy={cfg.box / 2}
            r={radius}
            className={cn(RISK_STYLES[risk].stroke, "transition-[stroke-dashoffset] duration-700 ease-out")}
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-display font-semibold leading-none", cfg.value)}>
            {score}
          </span>
          <span className={cn("mt-1 text-muted-foreground", cfg.sub)}>/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className={cn("font-medium", RISK_STYLES[risk].text)}>
          {label ?? RISK_LABELS[risk]}
        </p>
        {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
      </div>
    </div>
  );
}
