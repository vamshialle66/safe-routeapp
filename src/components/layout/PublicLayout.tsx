import type { ReactNode } from "react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <main className="flex-1 animate-fade-up">{children}</main>
      <PublicFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden bg-hero text-sidebar-accent-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <span className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em]">
          <span className="size-1.5 animate-pulse rounded-full bg-safe" aria-hidden="true" />
          {eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl font-display text-3xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base text-sidebar-foreground/80 sm:text-lg">{description}</p>
      </div>
    </section>
  );
}
