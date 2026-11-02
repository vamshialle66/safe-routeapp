import type { Point, RouteOption } from "@/types";

const p = (x: number, y: number): Point => ({ x, y });

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: "safest",
    name: "Safest Route",
    kind: "safest",
    safetyScore: 92,
    scoreLabel: "Excellent",
    distanceKm: 6.2,
    durationMin: 24,
    risk: "low",
    tags: ["Well Lit", "High Public Activity", "Low Risk"],
    factors: {
      lighting: 90,
      publicActivity: 95,
      crimeRisk: 88,
      roadConditions: 91,
      safeLocations: 94,
    },
    riskSegmentCount: 1,
    recommended: true,
    reasons: [
      "Better street lighting coverage across most of the journey",
      "Higher public activity along main avenues at this hour",
      "Lower exposure to segments flagged as higher risk",
      "More safe locations (police, hospitals, transit) nearby",
    ],
    segments: [
      {
        id: "s1",
        label: "Segment 1 · Kensington Ave",
        risk: "low",
        distanceKm: 2.1,
        note: "Continuous lighting, busy retail frontage.",
      },
      {
        id: "s2",
        label: "Segment 2 · Riverbank Crossing",
        risk: "moderate",
        distanceKm: 1.4,
        note: "Fewer pedestrians after 21:00; lighting is adequate.",
      },
      {
        id: "s3",
        label: "Segment 3 · Marlow Street",
        risk: "low",
        distanceKm: 1.6,
        note: "Transit station and 24h pharmacy en route.",
      },
      {
        id: "s4",
        label: "Segment 4 · Elmgrove Approach",
        risk: "low",
        distanceKm: 1.1,
        note: "Residential, well lit, steady activity.",
      },
    ],
    path: [p(14, 82), p(24, 62), p(42, 56), p(56, 38), p(74, 30), p(86, 18)],
  },
  {
    id: "balanced",
    name: "Balanced Route",
    kind: "balanced",
    safetyScore: 76,
    scoreLabel: "Good",
    distanceKm: 5.4,
    durationMin: 20,
    risk: "moderate",
    tags: ["Mostly Lit", "Moderate Activity", "Medium Risk"],
    factors: {
      lighting: 72,
      publicActivity: 70,
      crimeRisk: 74,
      roadConditions: 80,
      safeLocations: 76,
    },
    riskSegmentCount: 2,
    recommended: false,
    reasons: [
      "Shorter than the safest route with acceptable lighting coverage",
      "Two segments pass through quieter industrial blocks",
      "Fewer safe locations along the middle third of the journey",
    ],
    segments: [
      {
        id: "b1",
        label: "Segment 1 · Halden Road",
        risk: "low",
        distanceKm: 1.8,
        note: "Well lit arterial road.",
      },
      {
        id: "b2",
        label: "Segment 2 · Depot Lane",
        risk: "moderate",
        distanceKm: 1.5,
        note: "Industrial frontage, intermittent lighting.",
      },
      {
        id: "b3",
        label: "Segment 3 · Carter Underpass",
        risk: "moderate",
        distanceKm: 0.9,
        note: "Low visibility, limited foot traffic.",
      },
      {
        id: "b4",
        label: "Segment 4 · Marlow Street",
        risk: "low",
        distanceKm: 1.2,
        note: "Returns to a populated corridor.",
      },
    ],
    path: [p(14, 82), p(30, 74), p(48, 62), p(62, 46), p(78, 34), p(86, 18)],
  },
  {
    id: "fastest",
    name: "Fastest Route",
    kind: "fastest",
    safetyScore: 58,
    scoreLabel: "Fair",
    distanceKm: 4.8,
    durationMin: 17,
    risk: "high",
    tags: ["Shortest", "Low Lighting", "High Risk"],
    factors: {
      lighting: 48,
      publicActivity: 45,
      crimeRisk: 52,
      roadConditions: 66,
      safeLocations: 50,
    },
    riskSegmentCount: 4,
    recommended: false,
    reasons: [
      "Quickest option, but crosses four segments flagged as higher risk",
      "Extended stretches with limited lighting and low public activity",
      "Few safe locations within reach along the corridor",
    ],
    segments: [
      {
        id: "f1",
        label: "Segment 1 · Halden Road",
        risk: "low",
        distanceKm: 1.0,
        note: "Well lit arterial road.",
      },
      {
        id: "f2",
        label: "Segment 2 · Old Rail Cut",
        risk: "high",
        distanceKm: 1.3,
        note: "Isolated corridor, minimal lighting.",
      },
      {
        id: "f3",
        label: "Segment 3 · Warehouse Row",
        risk: "high",
        distanceKm: 1.4,
        note: "No pedestrian activity after hours.",
      },
      {
        id: "f4",
        label: "Segment 4 · Pike Alley",
        risk: "moderate",
        distanceKm: 1.1,
        note: "Narrow, poor sightlines.",
      },
    ],
    path: [p(14, 82), p(34, 80), p(52, 70), p(66, 52), p(80, 36), p(86, 18)],
  },
];

export const RECOMMENDATION_REASON =
  "Recommended because it has higher lighting coverage, greater public activity and fewer high-risk segments.";

export const getRouteById = (id: string) =>
  MOCK_ROUTES.find((r) => r.id === id);
