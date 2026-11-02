import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ApiPlace, ApiRoute, LatLng } from "@/lib/saferouteApi";
import { indexTone, routeGeometry, formatIndex, decodePolyline } from "@/lib/saferouteApi";

export interface LeafletMapProps {
  routes?: ApiRoute[] | undefined;
  selectedRoute?: number | undefined;
  onSelectRoute?: (n: number) => void | undefined;
  highlightSegment?: number | undefined;
  places?: ApiPlace[] | undefined;
  origin?: LatLng | undefined;
  destination?: LatLng | undefined;
  center?: LatLng | undefined;
  showPlaces?: boolean | undefined;
  /** Live position of a shared trip — pulsing marker, map follows it. */
  livePosition?: LatLng | undefined;
  /** Encoded polyline of the planned route (drawn as a single line). */
  routePolyline?: string | null | undefined;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#64748b";
}

const ll = (p: LatLng): L.LatLngExpression => [p.latitude, p.longitude];

export default function LeafletMap({
  routes = [],
  selectedRoute,
  onSelectRoute,
  highlightSegment,
  places,
  origin,
  destination,
  center,
  showPlaces = true,
  livePosition,
  routePolyline,
}: LeafletMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fittedKey = useRef<string>("");
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const f = () => setThemeTick((t) => t + 1);
    window.addEventListener("saferoute-theme", f);
    return () => window.removeEventListener("saferoute-theme", f);
  }, []);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(
      center ? ll(center) : [19.05, 72.86],
      13,
    );
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    const ro = new ResizeObserver(() => map.current?.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const colors = {
      safe: cssVar("--safe"),
      moderate: cssVar("--moderate"),
      risk: cssVar("--risk"),
      none: cssVar("--muted-foreground"),
      primary: cssVar("--primary"),
      card: cssVar("--card"),
    };
    const bounds = L.latLngBounds([]);

    routes
      .filter((r) => r.routeNumber !== selectedRoute)
      .forEach((r) => {
        const pts = routeGeometry(r).map(ll);
        pts.forEach((p) => bounds.extend(p));
        L.polyline(pts, { color: colors.none, weight: 5, opacity: 0.35 })
          .on("click", () => onSelectRoute?.(r.routeNumber))
          .bindTooltip(`Route ${r.routeNumber} · Open-places score: ${formatIndex(r.safetyIndex)}`, { sticky: true })
          .addTo(g);
      });

    const sel = routes.find((r) => r.routeNumber === selectedRoute);
    if (sel) {
      const pts = routeGeometry(sel).map(ll);
      pts.forEach((p) => bounds.extend(p));
      L.polyline(pts, { color: colors.primary, weight: 11, opacity: 0.18 }).addTo(g);
      sel.segments.forEach((s) => {
        const tone = indexTone(s.safetyIndex);
        const hl = s.segmentNumber === highlightSegment;
        L.polyline(s.geometry.map(ll), {
          color: colors[tone],
          weight: hl ? 10 : 6,
          opacity: 0.95,
          dashArray: tone === "none" ? "4 8" : undefined,
          lineCap: "round",
        })
          .bindTooltip(
            `${Math.round(s.lengthMeters)} m of your journey<br/>${s.scoredPlaceCount ? `${s.openPlaceCount} of ${s.scoredPlaceCount} checked places open` : "Opening hours unavailable here"}`,
            { sticky: true },
          )
          .addTo(g);
      });
      if (showPlaces) {
        sel.segments.forEach((s) =>
          s.places.forEach((p) => addPlace(g, p, colors)),
        );
      }
    }

    if (places && showPlaces) places.forEach((p) => {
      addPlace(g, p, colors);
      bounds.extend(ll(p));
    });

    const pin = (p: LatLng, label: string, color: string) =>
      L.marker(ll(p), {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:${color};color:${colors.card};width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font:600 12px Sora,sans-serif;border:3px solid ${colors.card};box-shadow:0 4px 12px rgba(0,0,0,.25)">${label}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(g);
    if (origin) {
      pin(origin, "A", colors.primary);
      bounds.extend(ll(origin));
    }
    if (destination) {
      pin(destination, "B", colors.risk);
      bounds.extend(ll(destination));
    }
    if (routePolyline) {
      const pts = decodePolyline(routePolyline).map(ll);
      if (pts.length > 1) {
        pts.forEach((p) => bounds.extend(p));
        L.polyline(pts, { color: colors.primary, weight: 6, opacity: 0.85, lineCap: "round" }).addTo(g);
      }
    }

    if (livePosition) {
      const p = ll(livePosition);
      L.circle(p, { radius: 40, color: colors.primary, weight: 1, fillColor: colors.primary, fillOpacity: 0.15 }).addTo(g);
      L.circleMarker(p, { radius: 9, color: colors.card, weight: 3, fillColor: colors.primary, fillOpacity: 1 })
        .bindTooltip("Live position", { sticky: true })
        .addTo(g);
      bounds.extend(p);
      m.panTo(p, { animate: true });
    }

    if (center && !origin) {
      L.circleMarker(ll(center), { radius: 8, color: colors.card, weight: 3, fillColor: colors.primary, fillOpacity: 1 }).addTo(g);
      L.circle(ll(center), { radius: 300, color: colors.primary, weight: 1, fillOpacity: 0.06 }).addTo(g);
      bounds.extend(ll(center));
    }

    const key = `${routes.map((r) => r.routeNumber + ":" + r.distanceMeters).join()}|${origin?.latitude}|${center?.latitude}|${places?.length}`;
    if (bounds.isValid() && key !== fittedKey.current) {
      fittedKey.current = key;
      m.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    }
  }, [routes, selectedRoute, highlightSegment, places, origin, destination, center, showPlaces, livePosition, routePolyline, onSelectRoute, themeTick]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="Route map" />;
}

function addPlace(g: L.LayerGroup, p: ApiPlace, c: Record<"safe" | "risk" | "none" | "card", string>) {
  const color = p.openNow === true ? c.safe : p.openNow === false ? c.risk : c.none;
  const status = p.openNow === true ? "Open now" : p.openNow === false ? "Closed" : "Hours unknown";
  L.circleMarker([p.latitude, p.longitude], {
    radius: 5,
    color: c.card,
    weight: 1.5,
    fillColor: color,
    fillOpacity: 1,
  })
    .bindTooltip(`<strong>${escapeHtml(p.name)}</strong><br/>${status}`)
    .addTo(g);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}
