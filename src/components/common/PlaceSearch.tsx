import { useEffect, useId, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchPlaces } from "@/lib/geocode";
import type { NamedPoint } from "@/lib/analysisStore";
import { cn } from "@/lib/utils";

export function PlaceSearch({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  trailing,
}: {
  label: string;
  value: NamedPoint | null;
  onChange: (p: NamedPoint | null) => void;
  icon: LucideIcon;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  const id = useId();
  const [text, setText] = useState(value?.label ?? "");
  const [results, setResults] = useState<NamedPoint[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const typed = useRef(false);

  useEffect(() => {
    setText(value?.label ?? "");
  }, [value]);

  useEffect(() => {
    if (!typed.current) return;
    const t = setTimeout(async () => {
      setLoading(true);
      setResults(await searchPlaces(text));
      setLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="relative">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative mt-1.5">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={id}
          value={text}
          placeholder={placeholder}
          autoComplete="off"
          className={cn("h-11 pl-9", trailing && "pr-11")}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            typed.current = true;
            setText(e.target.value);
            if (value) onChange(null);
          }}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="mr-2 size-4 animate-spin text-muted-foreground" /> : trailing}
        </div>
      </div>
      {open && results.length > 0 && !value && (
        <ul className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lift" role="listbox">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button
                type="button"
                className="block w-full truncate px-3 py-2.5 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  typed.current = false;
                  onChange(r);
                  setResults([]);
                  setOpen(false);
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
