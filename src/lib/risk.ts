import type { RiskLevel } from "@/types";

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low Risk",
  moderate: "Moderate Risk",
  high: "High Risk",
};

/** Token-driven classes so risk is never communicated by color alone. */
export const RISK_STYLES: Record<
  RiskLevel,
  { chip: string; dot: string; text: string; stroke: string; soft: string }
> = {
  low: {
    chip: "bg-safe-soft text-safe border-safe/30",
    dot: "bg-safe",
    text: "text-safe",
    stroke: "stroke-safe",
    soft: "bg-safe-soft",
  },
  moderate: {
    chip: "bg-moderate-soft text-moderate-foreground dark:text-moderate border-moderate/40",
    dot: "bg-moderate",
    text: "text-moderate",
    stroke: "stroke-moderate",
    soft: "bg-moderate-soft",
  },
  high: {
    chip: "bg-risk-soft text-risk border-risk/30",
    dot: "bg-risk",
    text: "text-risk",
    stroke: "stroke-risk",
    soft: "bg-risk-soft",
  },
};

export const riskFromScore = (score: number): RiskLevel =>
  score >= 85 ? "low" : score >= 65 ? "moderate" : "high";

export const scoreToneClass = (score: number) => RISK_STYLES[riskFromScore(score)].text;

export const formatKm = (km: number) => `${km.toFixed(1)} km`;
export const formatMin = (min: number) => `${min} min`;
