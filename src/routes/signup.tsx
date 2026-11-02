import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/layout/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — SafeRoute" },
      {
        name: "description",
        content: "Create a SafeRoute account to save your routes, trip history and trusted contacts across devices.",
      },
      { property: "og:title", content: "Create your SafeRoute account" },
      { property: "og:description", content: "Save your routes, trips and trusted contacts to your own account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Save routes, trips and trusted contacts to your own account.">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
