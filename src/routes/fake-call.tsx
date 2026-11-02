import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFakeCall } from "@/components/safety/FakeCallProvider";

export const Route = createFileRoute("/fake-call")({
  head: () => ({ meta: [
    { title: "Fake call — SafeRoute" },
    { name: "description", content: "Start a private simulated incoming call with a ringtone and realistic call screen." },
    { property: "og:title", content: "Fake call — SafeRoute" },
    { property: "og:description", content: "A simulated incoming call for stepping away from an uncomfortable situation." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: FakeCallPage,
});

function FakeCallPage() {
  const { caller, setCaller, start } = useFakeCall();
  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-6">
      <Button asChild variant="ghost" className="w-fit"><Link to="/route-planner"><ArrowLeft /> Back to SafeRoute</Link></Button>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        <span className="mb-6 grid size-16 place-items-center rounded-full bg-safe-soft text-safe"><PhoneCall className="size-7" /></span>
        <h1 className="font-display text-3xl font-semibold tracking-normal">Fake call</h1>
        <p className="mt-3 text-sm text-muted-foreground">A pretend incoming call, not a real phone call. No audio is recorded or sent.</p>
        <label htmlFor="fake-caller" className="mt-8 mb-2 text-sm font-medium">Caller name</label>
        <Input id="fake-caller" value={caller} maxLength={40} onChange={(e) => setCaller(e.target.value)} placeholder="Mum" className="h-12" />
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose caller">
          {["Mum", "Dad", "Home", "Roommate", "Office"].map((name) => <Button key={name} variant={caller === name ? "secondary" : "outline"} aria-pressed={caller === name} onClick={() => setCaller(name)}>{name}</Button>)}
        </div>
        <Button onClick={start} className="mt-8 h-14 w-full bg-safe text-safe-foreground hover:bg-safe/90"><PhoneCall /> Ring now</Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">Sound uses your device’s media volume.</p>
      </div>
    </main>
  );
}
