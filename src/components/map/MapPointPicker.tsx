import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { MapPointPickerProps } from "./MapPointPickerLeaflet";

const LeafletPicker = lazy(() => import("./MapPointPickerLeaflet"));

function Fallback() {
  return <div className="h-full w-full animate-pulse bg-muted" aria-label="Loading map" />;
}

/** SSR-safe wrapper: Leaflet is only loaded in the browser. */
export function MapPointPicker(props: MapPointPickerProps) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <LeafletPicker {...props} />
      </Suspense>
    </ClientOnly>
  );
}
