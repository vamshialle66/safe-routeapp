import { useEffect, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const ACCENTS = [
  { id: "navy", label: "Midnight", swatch: "oklch(0.32 0.088 262)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.48 0.17 355)" },
  { id: "teal", label: "Lagoon", swatch: "oklch(0.45 0.1 195)" },
  { id: "violet", label: "Aurora", swatch: "oklch(0.45 0.18 290)" },
  { id: "sunset", label: "Sunset", swatch: "oklch(0.55 0.17 40)" },
] as const;

/** Runs before paint to avoid a flash of the wrong theme. */
export const THEME_INIT_SCRIPT = `try{var d=document.documentElement,m=localStorage.getItem('saferoute.mode'),a=localStorage.getItem('saferoute.accent');if(m==='dark')d.classList.add('dark');if(a&&a!=='navy')d.setAttribute('data-accent',a)}catch(e){}`;

function apply(mode: "light" | "dark", accent: string) {
  const d = document.documentElement;
  d.classList.toggle("dark", mode === "dark");
  if (accent === "navy") d.removeAttribute("data-accent");
  else d.setAttribute("data-accent", accent);
  localStorage.setItem("saferoute.mode", mode);
  localStorage.setItem("saferoute.accent", accent);
  window.dispatchEvent(new Event("saferoute-theme"));
}

export function ThemePicker({ className }: { className?: string }) {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState("navy");

  useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    setAccent(document.documentElement.getAttribute("data-accent") ?? "navy");
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme" className={className}>
          <Palette className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-2xl p-4">
        <p className="text-sm font-semibold">Appearance</p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                apply(m, accent);
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
                mode === m ? "bg-card shadow-soft" : "text-muted-foreground",
              )}
            >
              {m === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {m === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">Colour theme</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              title={a.label}
              aria-label={a.label}
              onClick={() => {
                setAccent(a.id);
                apply(mode, a.id);
              }}
              className={cn(
                "group flex flex-col items-center gap-1 text-[10px] text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-full ring-offset-2 ring-offset-popover transition-transform group-hover:scale-110",
                  accent === a.id && "ring-2 ring-ring",
                )}
                style={{ background: a.swatch }}
              >
                {accent === a.id && <Check className="size-4 text-primary-foreground" />}
              </span>
              {a.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
