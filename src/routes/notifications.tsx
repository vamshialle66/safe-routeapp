import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SafeRoute" },
      { name: "description", content: "Updates about your routes, location sharing and account." },
      { property: "og:title", content: "Notifications — SafeRoute" },
      { property: "og:description", content: "Your SafeRoute updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <AppLayout
      title="Notifications"
    >
      <div className="mx-auto max-w-2xl space-y-2">
        <p className="py-8 text-center text-sm text-muted-foreground">No notifications. SafeRoute does not continuously monitor your location or send automatic safety updates.</p>
      </div>
    </AppLayout>
  );
}
