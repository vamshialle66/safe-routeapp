import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Store, Info } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { IndexRing } from "@/components/route/IndexPill";
import { Disclaimer } from "@/components/route/Disclaimer";

export const Route = createFileRoute("/safety")({
  head: () => ({ meta: [
    { title: "Understand the Score — SafeRoute" },
    { name: "description", content: "Learn what SafeRoute’s open-places score means, how opening hours affect it and why it cannot guarantee safety." },
    { property: "og:title", content: "Understand the Score — SafeRoute" },
    { property: "og:description", content: "A simple guide to nearby open places, missing data and the limits of route scores." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SafetyPage,
});

function SafetyPage() {
  return <PublicLayout>
    <PageHeader eyebrow="Understand the score" title="More open places. Not a promise of safety." description="The score shows the average percentage of nearby shops and services that are open along your journey. Use it alongside travel time and distance when choosing a route." />
    <section className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3 border-l-4 border-moderate bg-moderate-soft p-5 text-sm text-moderate-foreground"><Info className="mt-0.5 size-5 shrink-0" /><p>SafeRoute does not check crime rates, street lighting, road conditions or how many people are outside. An open shop does not mean help is guaranteed.</p></div>
      <div className="border-y border-border py-6"><h2 className="text-2xl font-semibold">Two scores, two different meanings</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The open-places score is the percentage open. The new route comparison score also considers how many open places were found and nearby open police stations, fire stations, hospitals and pharmacies. It is an experimental comparison, not a validated safety score.</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">When help is found, open-place density contributes 70% and observed nearby help contributes 30%. When help is unknown, only density is used. Fewer than half the journey checked means no overall score. Missing crime and lighting information is never treated as safe.</p></div>
      <div className="grid gap-8 md:grid-cols-2">
        <div><h2 className="text-2xl font-semibold">A simple example</h2><div className="mt-5 flex items-center gap-5"><IndexRing value={80} size={88} /><div><p className="font-semibold">8 of 10 places are open</p><p className="mt-1 text-sm text-muted-foreground">This short part of the route scores 80 out of 100.</p><p className="mt-2 text-xs text-muted-foreground">Illustration only — not a live result.</p></div></div></div>
        <div><h2 className="text-2xl font-semibold">How a route gets its score</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground"><li>Find shops and services near your route.</li><li>Include the types of places you chose in Settings.</li><li>Check which are open. Leave out places with unknown opening hours.</li><li>Average the percentage open along the journey. Longer distances count more; areas with unknown hours do not count.</li></ol></div>
      </div>
      <div className="border-y border-border py-8"><h2 className="text-2xl font-semibold">Read the colours</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><div><dt className="font-semibold text-safe">Green · 70–100</dt><dd className="mt-1 text-sm text-muted-foreground">A higher share of nearby places are open.</dd></div><div><dt className="font-semibold text-moderate-foreground dark:text-moderate">Amber · 40–69</dt><dd className="mt-1 text-sm text-muted-foreground">A mix of open and closed places.</dd></div><div><dt className="font-semibold text-risk">Red · Below 40</dt><dd className="mt-1 text-sm text-muted-foreground">A lower share of nearby places are open. This is not a danger rating.</dd></div><div><dt className="font-semibold text-muted-foreground">Grey · No score</dt><dd className="mt-1 text-sm text-muted-foreground">Not enough opening-hours data. Missing data does not mean unsafe.</dd></div></dl></div>
      <div className="grid gap-8 md:grid-cols-2"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><Store className="size-5 text-primary" /> Choose the places that count</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">In Settings, choose shops, cafés, pharmacies, police stations, ATMs, public toilets and more. Your choices affect new trips and nearby searches using the built-in live service, not old results, sample data or a separate server.</p><Button asChild variant="outline" className="mt-5"><Link to="/settings">Choose place types <ArrowRight className="size-4" /></Link></Button></div><div><h2 className="text-xl font-semibold">Know the data’s limits</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground"><li>Google Maps opening hours may be missing or outdated.</li><li>Searches may not find every place along the route.</li><li>Live data means a live lookup, not a check by someone on the street.</li><li>Sample data is an example and does not describe current conditions.</li><li>Use your own judgement and local knowledge.</li></ul></div></div>
      <Disclaimer />
      <Button asChild><Link to="/route-planner">Plan a route <ArrowRight className="size-4" /></Link></Button>
    </section>
  </PublicLayout>;
}
