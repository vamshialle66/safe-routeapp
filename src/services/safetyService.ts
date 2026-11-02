import { SAFETY_FACTOR_INFO, DISCLAIMER } from "@/data/mockData";
import type { RiskLevel, RouteOption, SafetyFactors } from "@/types";

const WEIGHTS: Record<keyof SafetyFactors, number> = {
  lighting: 0.24,
  publicActivity: 0.24,
  crimeRisk: 0.26,
  roadConditions: 0.12,
  safeLocations: 0.14,
};

export const FACTOR_LABELS: Record<keyof SafetyFactors, string> = {
  lighting: "Lighting",
  publicActivity: "Public Activity",
  crimeRisk: "Crime / Risk",
  roadConditions: "Road Conditions",
  safeLocations: "Safe Locations",
};

export const safetyService = {
  /** Weighted composite score. Replace with the scoring API response later. */
  computeScore(factors: SafetyFactors): number {
    const total = (Object.keys(WEIGHTS) as (keyof SafetyFactors)[]).reduce(
      (sum, key) => sum + factors[key] * WEIGHTS[key],
      0,
    );
    return Math.round(total);
  },

  scoreLabel(score: number): string {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Fair";
    return "Poor";
  },

  riskFromScore(score: number): RiskLevel {
    if (score >= 85) return "low";
    if (score >= 65) return "moderate";
    return "high";
  },

  factorWeights() {
    return (Object.keys(WEIGHTS) as (keyof SafetyFactors)[]).map((key) => ({
      key,
      label: FACTOR_LABELS[key],
      weight: Math.round(WEIGHTS[key] * 100),
    }));
  },

  factorInfo() {
    return SAFETY_FACTOR_INFO;
  },

  disclaimer() {
    return DISCLAIMER;
  },

  recommendationReason(route: RouteOption): string {
    return `Recommended because it has ${route.factors.lighting}% lighting coverage, ${route.factors.publicActivity}% public activity and only ${route.riskSegmentCount} segment${route.riskSegmentCount === 1 ? "" : "s"} flagged as higher risk.`;
  },
};
