import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function MapLegend() {
  const items = [
    ["bg-safe", "70–100% of checked places open"],
    ["bg-moderate", "40–69% of checked places open"],
    ["bg-risk", "Less than 40% of checked places open"],
    ["bg-muted-foreground/50", "Not enough data"],
  ];
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(window.matchMedia("(min-width: 640px)").matches), []);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group absolute bottom-3 left-3 z-[500] max-w-[calc(100%-1.5rem)] rounded-xl border border-border bg-card/95 text-xs shadow-soft backdrop-blur [&:not([open])]:rounded-full"
    >
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 px-3 py-2 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex gap-0.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-safe" />
          <span className="size-2 rounded-full bg-moderate" />
          <span className="size-2 rounded-full bg-risk" />
        </span>
        Route colours
        <span className="ml-auto text-muted-foreground group-open:rotate-180" aria-hidden="true">▾</span>
      </summary>
      <ul className="space-y-1 px-3 pb-3">
        {items.map(([c, l]) => (
          <li key={l} className="flex items-center gap-2">
            <span className={cn("h-1.5 w-5 shrink-0 rounded-full", c)} /> {l}
          </li>
        ))}
      </ul>
    </details>
  );
}
