import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInPrompt({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
      <UserRound className="mx-auto size-7 text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button asChild size="sm"><Link to="/login">Log in</Link></Button>
        <Button asChild size="sm" variant="outline"><Link to="/signup">Create account</Link></Button>
      </div>
    </div>
  );
}
