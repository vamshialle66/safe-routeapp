import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { supabase } from "@/integrations/supabase/client";
import { displayName, initials, updateProfile, useSession } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — SafeRoute" },
      { name: "description", content: "Your SafeRoute profile and contact details." },
      { property: "og:title", content: "Profile — SafeRoute" },
      { property: "og:description", content: "Manage your SafeRoute profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(session.profile?.display_name ?? "");
    setPhone(session.profile?.phone ?? "");
  }, [session.profile]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const shown = displayName(session);
  return (
    <AppLayout title="Profile" description="Your account keeps saved routes, trips and trusted contacts on every device.">
      <div className="mx-auto max-w-2xl space-y-6">
        {!session.ready ? null : !session.user ? (
          <SignInPrompt text="Log in to see and edit your profile." />
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-xl font-semibold text-primary-foreground">{initials(shown)}</span>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">{shown}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground"><Mail className="size-3.5" />{session.user.email}</p>
                {session.profile?.phone && <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="size-3.5" />{session.profile.phone}</p>}
              </div>
            </div>
            <form
              className="space-y-4 rounded-2xl border border-border bg-card p-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                try {
                  await updateProfile({ display_name: name.trim().slice(0, 80), phone: phone.trim().slice(0, 30) });
                  toast.success("Profile updated");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Couldn't save");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div><Label htmlFor="n">Full name</Label><Input id="n" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label htmlFor="e">Email</Label><Input id="e" type="email" className="mt-1.5" value={session.user.email ?? ""} disabled /></div>
              <div><Label htmlFor="p">Phone</Label><Input id="p" type="tel" className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={signOut}>Log out</Button>
                <Button type="submit" disabled={saving}>Save changes</Button>
              </div>
            </form>
          </>
        )}
      </div>
    </AppLayout>
  );
}
