import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/layout/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — SafeRoute" },
      {
        name: "description",
        content: "Log in to SafeRoute to keep your saved routes, trip history and emergency contacts together.",
      },
      { property: "og:title", content: "Log in to SafeRoute" },
      { property: "og:description", content: "Keep your saved routes, trip history and emergency contacts with you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep your saved routes, trips and contacts with you.">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
