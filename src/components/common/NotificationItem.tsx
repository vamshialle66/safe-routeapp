import { Bell, MapPin, Route, ShieldCheck, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

const ICONS: Record<AppNotification["kind"], LucideIcon> = {
  route: Route,
  safety: ShieldCheck,
  location: MapPin,
  account: User,
};

export function NotificationItem({
  notification,
  onToggleRead,
}: {
  notification: AppNotification;
  onToggleRead?: (id: string) => void;
}) {
  const Icon = ICONS[notification.kind] ?? Bell;
  return (
    <button
      type="button"
      onClick={() => onToggleRead?.(notification.id)}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors",
        notification.read
          ? "border-border bg-card hover:bg-secondary/60"
          : "border-primary/30 bg-primary-soft/60 hover:bg-primary-soft",
      )}
      aria-label={`${notification.read ? "Mark as unread" : "Mark as read"}: ${notification.title}`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-soft">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-medium">{notification.title}</span>
          {!notification.read && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              New
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{notification.body}</span>
        <span className="mt-1.5 block text-xs text-muted-foreground">{notification.time}</span>
      </span>
    </button>
  );
}
