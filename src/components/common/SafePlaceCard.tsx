import { Building2, Cross, Hospital, ShieldCheck, TrainFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAFE_PLACE_LABELS } from "@/services/locationService";
import type { SafePlace, SafePlaceType } from "@/types";

const ICONS: Record<SafePlaceType, LucideIcon> = {
  police: ShieldCheck,
  hospital: Hospital,
  pharmacy: Cross,
  public: Building2,
  transit: TrainFront,
};

export function SafePlaceCard({
  place,
  onView,
}: {
  place: SafePlace;
  onView?: (place: SafePlace) => void;
}) {
  const Icon = ICONS[place.type];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{place.name}</p>
        <p className="text-xs text-muted-foreground">
          {SAFE_PLACE_LABELS[place.type]} · {place.distanceKm.toFixed(1)} km away
          {place.open24h ? " · Open 24h" : ""}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => onView?.(place)}>
        View on Map
      </Button>
    </div>
  );
}
