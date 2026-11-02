import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const session = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (session.user) navigate({ to: "/dashboard", replace: true });
  }, [session.user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { display_name: name.trim() || undefined } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
    if (r.error) {
      setError(r.error instanceof Error ? r.error.message : "Google sign-in failed.");
      setLoading(false);
    }
  }

  async function forgot() {
    if (!email.includes("@")) return setError("Type your email above first, then tap Forgot password.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    if (error) setError(error.message);
    else toast.success("Check your email for a reset link");
  }

  if (sent)
    return (
      <div className="rounded-2xl border border-border bg-secondary/50 p-6 text-center">
        <Mail className="mx-auto size-8 text-primary" />
        <p className="mt-3 font-display font-semibold">Check your email</p>
        <p className="mt-1 text-sm text-muted-foreground">We sent a confirmation link to {email}. Open it to finish creating your account.</p>
      </div>
    );

  return (
    <>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "signup" && (
          <Field id="name" label="Your name" icon={UserRound} value={name} onChange={setName} autoComplete="name" />
        )}
        <Field id="email" label="Email address" icon={Mail} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field
          id="password"
          label="Password"
          icon={Lock}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        {mode === "login" && (
          <div className="text-right text-sm">
            <button type="button" onClick={forgot} className="text-primary hover:underline">Forgot password?</button>
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-risk/40 bg-risk-soft px-4 py-3 text-sm text-risk">{error}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {mode === "signup" ? "Create account" : "Log In"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" size="lg" className="w-full" onClick={google} disabled={loading}>
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signup" ? "Already have an account? " : "New to SafeRoute? "}
        <Link to={mode === "signup" ? "/login" : "/signup"} className="font-medium text-primary hover:underline">
          {mode === "signup" ? "Log in" : "Create an account"}
        </Link>
      </p>
    </>
  );
}

function Field(props: {
  id: string;
  label: string;
  icon: typeof Mail;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const Icon = props.icon;
  return (
    <div>
      <Label htmlFor={props.id}>{props.label}</Label>
      <div className="relative mt-1.5">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={props.id}
          type={props.type ?? "text"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="h-11 pl-9"
          autoComplete={props.autoComplete}
          required
        />
      </div>
    </div>
  );
}
