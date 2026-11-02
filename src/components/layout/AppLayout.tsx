import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Compass,
  History,
  LayoutDashboard,
  LifeBuoy,
  PhoneCall,
  Map,
  Menu,
  Radar,
  Bookmark,
  Search,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { displayName, initials, useSession } from "@/lib/session";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { myReviewerStatusFn } from "@/lib/communityAlerts.functions";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { to: "/dashboard", label: "My journeys", icon: LayoutDashboard },
  { to: "/route-planner", label: "Plan Route", icon: Compass },
  { to: "/routes", label: "Compare routes", icon: Map },
  { to: "/recent-trips", label: "Trip history", icon: History },
  { to: "/saved-routes", label: "Saved Routes", icon: Bookmark },
  { to: "/safety-map", label: "Around Me", icon: Map },
  { to: "/emergency", label: "Emergency", icon: LifeBuoy },
  { to: "/fake-call", label: "Fake call", icon: PhoneCall },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

const BOTTOM_NAV: NavItem[] = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

const REVIEWER_NAV: NavItem = { to: "/moderation", label: "Review reports", icon: ShieldCheck };

const MOBILE_NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/route-planner", label: "Plan", icon: Compass },
  { to: "/routes", label: "Routes", icon: Map },
  { to: "/safety-map", label: "Around me", icon: Radar },
  { to: "/fake-call", label: "Fake call", icon: PhoneCall },
  { to: "/profile", label: "Profile", icon: User },
];

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: (() => void) | undefined }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      activeProps={{
        className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      }}
      activeOptions={{ exact: item.to === "/routes" }}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate, reviewer = false }: { onNavigate?: (() => void) | undefined; reviewer?: boolean | undefined }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-5 py-5">
        <Link to="/" aria-label="SafeRoute home" onClick={onNavigate}>
          <Logo variant="inverted" />
        </Link>
      </div>
      <nav aria-label="App sections" className="flex-1 space-y-1 overflow-y-auto px-3">
        {MAIN_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border p-3">
        {BOTTOM_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        {reviewer && <SidebarLink item={REVIEWER_NAV} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

export function AppLayout({
  children,
  title,
  description,
  actions,
  fullBleed = false,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  fullBleed?: boolean;
}) {
  const [drawer, setDrawer] = useState(false);
  const session = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reviewerStatus = useServerFn(myReviewerStatusFn);
  const reviewerQuery = useQuery({
    queryKey: ["reviewer-status", session.user?.id],
    queryFn: () => reviewerStatus(),
    enabled: !!session.user,
    staleTime: 60_000,
  });
  const isReviewer = reviewerQuery.data?.reviewer === true;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarContent reviewer={isReviewer} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close navigation"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-lift">
            <SidebarContent onNavigate={() => setDrawer(false)} reviewer={isReviewer} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-4 text-sidebar-foreground"
              onClick={() => setDrawer(false)}
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </Button>

            <div className="relative hidden max-w-sm flex-1 sm:block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search places, routes, saved trips"
                className="h-10 pl-9"
                aria-label="Search"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemePicker />
              <Button asChild variant="ghost" size="icon" aria-label="Notifications">
                <Link to="/notifications">
                  <span className="relative">
                    <Bell className="size-5" />
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-risk" />
                  </span>
                </Link>
              </Button>
              {session.user ? (
                <Button asChild variant="ghost" size="icon" aria-label="Profile">
                  <Link to="/profile">
                    <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {initials(displayName(session))}
                    </span>
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm"><Link to="/login">Log in</Link></Button>
              )}
            </div>
          </div>
        </header>

        <main
          key={pathname}
          className={cn(
            "animate-fade-up pb-24 lg:pb-10",
            fullBleed ? "" : "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8",
          )}
        >
          {!fullBleed && (
            <div className="relative mb-8 overflow-hidden rounded-2xl bg-hero px-5 py-6 text-sidebar-accent-foreground shadow-lg sm:rounded-3xl sm:px-10 sm:py-10">
              <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <span className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]">
                    <span className="size-1.5 animate-pulse rounded-full bg-safe" aria-hidden="true" />
                    SafeRoute
                  </span>
                  <h1 className="mt-4 font-display text-2xl font-semibold leading-tight break-words sm:text-4xl">{title}</h1>
                  {description && (
                    <p className="mt-2 max-w-2xl text-sm text-sidebar-foreground/80 sm:text-base">{description}</p>
                  )}
                </div>
                {actions && <div className="glass-dark flex w-full flex-wrap gap-2 rounded-2xl p-1.5 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-6">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground transition-colors"
                  activeProps={{ className: "text-primary font-medium" }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
