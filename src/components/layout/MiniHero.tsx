import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Compact hero banner for full-screen map pages, matching the shared page banners. */
export function MiniHero({ title, description, className, children }: { title: string; description: string; className?: string; children?: ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-hero px-5 py-5 text-sidebar-accent-foreground shadow-lg", className)}>
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
      <div className="relative min-w-0">
        <span className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]">
          <span className="size-1.5 animate-pulse rounded-full bg-safe" aria-hidden="true" />
          SafeRoute
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-sidebar-foreground/80">{description}</p>
        {children}
      </div>
    </div>
  );
}
