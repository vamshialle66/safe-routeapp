import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { LeafletMapProps } from "./LeafletMap";

const LeafletMap = lazy(() => import("./LeafletMap"));

function Fallback() {
  return <div className="h-full w-full animate-pulse bg-muted" aria-label="Loading map" />;
}

/** SSR-safe wrapper: Leaflet is only loaded in the browser. */
export function RouteMap(props: LeafletMapProps) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <LeafletMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
