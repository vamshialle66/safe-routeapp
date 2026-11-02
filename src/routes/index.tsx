import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPinned, Route as RouteIcon, Store, Navigation, Info } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/map/RouteMap";
import { IndexRing } from "@/components/route/IndexPill";
import { SourceBadge, Disclaimer } from "@/components/route/Disclaimer";
import { demoSegments } from "@/lib/demoAnalysis";
import { SAMPLE_DESTINATION, SAMPLE_ORIGIN } from "@/lib/geocode";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "SafeRoute — Find routes with more open places nearby" },
    { name: "description", content: "Compare routes by nearby open shops and services, distance and travel time. Choose a route and open directions in Google Maps." },
    { property: "og:title", content: "SafeRoute — More context for your journey" },
    { property: "og:description", content: "Find routes with more open places nearby. Compare travel time and distance before you choose." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LandingPage,
});

const HERO = demoSegments(SAMPLE_ORIGIN, SAMPLE_DESTINATION, "WALK");
const STEPS = [
  { icon: MapPinned, title: "Choose where to go", body: "Enter your starting point, destination and how you’ll travel." },
  { icon: Store, title: "Compare nearby open places", body: "See each route’s open-places score, distance and travel time." },
  { icon: Navigation, title: "Choose your route", body: "Save it for later or open directions in Google Maps." },
];

function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero text-sidebar-accent-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div className="animate-fade-up">
            <span className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"><RouteIcon className="size-4" /> Route planning with nearby open places</span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-6xl">SafeRoute</h1>
            <p className="mt-4 text-2xl font-medium text-sidebar-primary sm:text-3xl">Find a way with more open places nearby.</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-sidebar-foreground/80">Heading home or somewhere new? Compare routes by nearby open shops, cafés and services, alongside distance and travel time.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"><Link to="/route-planner">Plan a route <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="ghost" className="glass-dark text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><Link to="/how-it-works">How it works</Link></Button>
            </div>
            <p className="mt-3 text-xs text-sidebar-foreground/80">Sign in for real route searches and nearby places. Examples are available without an account.</p>
            <p className="mt-6 flex max-w-xl items-start gap-2 text-xs leading-relaxed text-sidebar-foreground/80"><Info className="mt-0.5 size-4 shrink-0" /> More open places do not guarantee safety. SafeRoute does not measure crime, street lighting or the number of people outside.</p>
          </div>
          <div className="relative">
            <div className="mb-3 flex items-center justify-between gap-2"><span className="text-sm font-medium">Example: Kurla → Dadar</span><SourceBadge source="demo" /></div>
            <div className="relative h-[320px] overflow-hidden rounded-2xl border border-sidebar-border shadow-lift sm:h-[420px]"><RouteMap routes={HERO.routes} selectedRoute={2} origin={SAMPLE_ORIGIN} destination={SAMPLE_DESTINATION} showPlaces={false} /></div>
            <div className="glass relative z-[500] mx-3 -mt-12 flex items-center gap-4 rounded-xl p-4 text-card-foreground sm:mx-6">
              <IndexRing value={HERO.routes[1]?.safetyIndex} size={64} />
              <div><p className="font-semibold">Open-places score</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Higher scores mean a larger share of nearby places are open — not that a route is safer.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">Your journey, in three steps</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">{STEPS.map((step, i) => { const Icon = step.icon; return <li key={step.title} className="border-t border-border pt-5"><span className="inline-flex items-center gap-2 text-sm font-medium text-primary"><Icon className="size-5" /> Step {i + 1}</span><h3 className="mt-3 text-lg font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p></li>; })}</ol>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div><h2 className="text-2xl font-semibold">What does the score mean?</h2><p className="mt-4 leading-relaxed text-muted-foreground">The score shows the average percentage of nearby shops and services that are open along your journey. Higher means more of the checked places are open, not that the route is safer.</p><p className="mt-3 text-sm text-muted-foreground">For example, if 8 out of 10 checked places are open near a point on your route, the score there is 80 out of 100. Places with unknown hours do not count.</p><Button asChild variant="outline" className="mt-6"><Link to="/safety">Understand the score <ArrowRight className="size-4" /></Link></Button></div>
        <div className="space-y-5"><div><h3 className="text-lg font-semibold">Real searches, separate examples</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">After sign-in, searches request Google Maps routes and places. If that search fails, we tell you instead of inventing results. Examples are a separate choice, never directions to follow.</p></div><div><h3 className="text-lg font-semibold">Choose what matters to you</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Settings lets you choose which place types count, including shops, pharmacies, police stations, ATMs and public toilets.</p></div><Disclaimer /></div>
      </section>
    </PublicLayout>
  );
}
