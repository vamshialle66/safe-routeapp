import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "inverted";
  showWordmark?: boolean;
}

export function Logo({ className, variant = "default", showWordmark = true }: LogoProps) {
  const inverted = variant === "inverted";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          inverted ? "bg-sidebar-accent" : "bg-brand-gradient",
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path
            d="M12 2.6 20 5.4v6.1c0 4.9-3.3 8.6-8 10.1-4.7-1.5-8-5.2-8-10.1V5.4L12 2.6Z"
            className={inverted ? "fill-sidebar-primary/25 stroke-sidebar-primary" : "fill-primary-foreground/15 stroke-primary-foreground"}
            strokeWidth="1.4"
          />
          <circle
            cx="12"
            cy="10.6"
            r="2.1"
            className={inverted ? "stroke-sidebar-primary" : "stroke-primary-foreground"}
            strokeWidth="1.5"
          />
          <path
            d="M12 12.9V17"
            className={inverted ? "stroke-sidebar-primary" : "stroke-primary-foreground"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-tight",
            inverted ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Safe<span className={inverted ? "text-sidebar-primary" : "text-primary"}>Route</span>
        </span>
      )}
    </span>
  );
}
