import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Flag,
  Gauge,
  MapPin,
  Route as RouteIcon,
  ScanSearch,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/map/RouteMap";
import { demoSegments } from "@/lib/demoAnalysis";
import { SAMPLE_ORIGIN, SAMPLE_DESTINATION } from "@/lib/geocode";
import { Disclaimer } from "@/components/route/Disclaimer";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How SafeRoute Works — Safety-Scored Route Planning" },
      {
        name: "description",
        content:
          "Enter a starting point and destination, compare nearby open places and open directions in Google Maps.",
      },
      { property: "og:title", content: "How SafeRoute Works" },
      {
        property: "og:description",
        content:
          "Plan a trip, compare open-places scores and choose your route.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowItWorksPage,
});

const FLOW = [
  { icon: MapPin, title: "Enter your start and destination", body: "Search for a place and choose a suggestion. You can also use your current location as the start." },
  { icon: RouteIcon, title: "Choose how you’ll travel", body: "Pick walking, driving or another travel option, then select Find routes." },
  { icon: Scale, title: "Compare your options", body: "Look at each route’s open-places score, distance and travel time. Higher scores mean a larger share of nearby places are open, not that the route is safer." },
  { icon: CheckCircle2, title: "Choose a route and open Maps", body: "Select a route to see details, save it, or open directions in Google Maps. Sign in if you want saved routes to follow you across devices." },
];

function HowItWorksPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="How it works"
        title="Plan, compare, and go"
        description="Start with where you are and where you want to go. SafeRoute adds nearby open places to the usual distance and travel-time comparison."
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <ol className="relative space-y-6 before:absolute before:left-[1.4rem] before:top-3 before:bottom-3 before:w-px before:bg-border md:before:left-1/2">
          {FLOW.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative md:grid md:grid-cols-2 md:gap-10">
                <div
                  className={
                    i % 2 === 0
                      ? "md:col-start-1 md:text-right md:pr-12"
                      : "md:col-start-2 md:pl-12"
                  }
                >
                  <div className="ml-14 rounded-2xl border border-border bg-card p-6 shadow-soft md:ml-0">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Step {i + 1}
                    </span>
                    <h2 className="mt-2 font-display text-lg font-semibold">{step.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
                <span
                  className="absolute left-0 top-6 grid size-11 place-items-center rounded-xl border border-border bg-background text-primary shadow-soft md:left-1/2 md:-translate-x-1/2"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">More context than distance alone</h2>
            <p className="mt-4 text-muted-foreground">
              A higher open-places score means a larger share of nearby shops and services are open.
              Compare it with distance and travel time, then choose what suits your journey.
              It does not tell you how many people are outside or guarantee safety.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "See open-places scores for short parts of your route",
                "Missing opening hours are left out of the score",
                "Directions open in Google Maps after you choose a route",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-safe" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8">
              <Link to="/route-planner">
                Try the route planner
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div><p className="mb-3 text-xs text-muted-foreground">Example route · Sample data</p><div className="h-[380px] overflow-hidden rounded-xl border border-border"><RouteMap routes={demoSegments(SAMPLE_ORIGIN, SAMPLE_DESTINATION, "WALK").routes} origin={SAMPLE_ORIGIN} destination={SAMPLE_DESTINATION} showPlaces={false} /></div></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-secondary p-6 text-sm text-muted-foreground">
          <p className="mb-2 inline-flex items-center gap-2 font-medium text-foreground">
            <Compass className="size-4" aria-hidden="true" />
            About the data
          </p>
          <Disclaimer />
        </div>
      </section>
    </PublicLayout>
  );
}
