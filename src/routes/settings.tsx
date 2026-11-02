import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Server, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ALL_CATEGORY_IDS, PLACE_CATEGORIES, getScoreCategories, setScoreCategories } from "@/lib/placeCategories";
import { getCustomApiUrl, saferouteApi, setApiUrl, setDemoOnly } from "@/lib/saferouteApi";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SafeRoute" },
      { name: "description", content: "Choose which nearby places count toward route scores and manage your app preferences." },
      { property: "og:title", content: "Settings — SafeRoute" },
      { property: "og:description", content: "SafeRoute app settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");

  const [cats, setCats] = useState<string[]>(ALL_CATEGORY_IDS);
  function toggleCat(id: string, on: boolean) {
    const next = on ? [...cats, id] : cats.filter((c) => c !== id);
    setCats(next);
    setScoreCategories(next);
  }

  useEffect(() => {
    setCats(getScoreCategories());
    setUrl(getCustomApiUrl());
    setDemoOnly(false);
  }, []);

  async function test() {
    setApiUrl(url);
    if (!url.trim()) { setStatus("ok"); return; }
    setStatus("checking");
    setStatus((await saferouteApi.ping()) ? "ok" : "fail");
  }

  return (
    <AppLayout title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2"><Server className="size-4" /><h2 className="font-display font-semibold">Map data settings</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Real searches use Google Maps after you sign in. Leave this empty unless you run a separate SafeRoute server. Searches never replace missing results with invented routes or places.</p>
          <Label htmlFor="url" className="mt-4 block">Server address</Label>
          <div className="mt-1.5 flex gap-2">
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Leave empty to use Google Maps" />
            <Button onClick={test} disabled={status === "checking"}>
              {status === "checking" && <Loader2 className="size-4 animate-spin" />} {url.trim() ? "Test & save" : "Save"}
            </Button>
          </div>
          {status === "ok" && <p className="mt-3 flex items-center gap-2 text-sm text-safe"><CheckCircle2 className="size-4" /> {url.trim() ? "Server responded. This does not verify its map data." : "Saved. Google Maps is selected; its availability is checked when you search."}</p>}
          {status === "fail" && (
            <p className="mt-3 flex items-start gap-2 text-sm text-risk">
              <XCircle className="mt-0.5 size-4 shrink-0" /> Couldn't connect. Check the server is running and allows requests from this site.
            </p>
          )}
          <p className="mt-6 text-xs text-muted-foreground">Examples are available only through the separate example buttons. They cannot turn real searches into sample searches.</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-semibold">Places that count toward the score</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose which place types affect the open-places score. Unticked places still show on the map but don't change the score. Applies to new live trips and nearby searches. Sample results and separate servers do not use these choices.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PLACE_CATEGORIES.map((c) => (
              <label key={c.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-muted/50">
                <Checkbox className="mt-0.5" checked={cats.includes(c.id)} onCheckedChange={(v) => toggleCat(c.id, v === true)} />
                <span><span className="block text-sm font-medium">{c.label}</span><span className="block text-xs text-muted-foreground">{c.hint}</span></span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setCats(ALL_CATEGORY_IDS); setScoreCategories(ALL_CATEGORY_IDS); }}>Select all</Button>
            <Button variant="outline" size="sm" onClick={() => { setCats([]); setScoreCategories([]); }}>Clear all</Button>
          </div>
          {cats.length === 0 && <p className="mt-3 text-sm text-risk">With nothing selected, routes can't be scored.</p>}
        </section>
      </div>
    </AppLayout>
  );
}
