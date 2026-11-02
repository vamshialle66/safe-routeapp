import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/saferouteApi";

export interface MapPointPickerProps {
  geometry: LatLng[];
  value: LatLng | null;
  onChange: (p: LatLng | null) => void;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#64748b";
}

/** Browser-only Leaflet map: shows the route, a tap pins the reported spot. */
export default function MapPointPickerLeaflet({ geometry, value, onChange }: MapPointPickerProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  const geomKey = useMemo(
    () => geometry.map((p) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`).join(";"),
    [geometry],
  );

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(m);
    const pts = geometry.map((p) => [p.latitude, p.longitude] as L.LatLngExpression);
    if (pts.length) {
      L.polyline(pts, { color: cssVar("--primary"), weight: 6, opacity: 0.85, lineCap: "round" }).addTo(m);
      m.fitBounds(L.latLngBounds(pts), { padding: [24, 24], maxZoom: 16 });
    }
    m.on("click", (e: L.LeafletMouseEvent) => changeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    const ro = new ResizeObserver(() => map.current?.invalidateSize());
    ro.observe(el.current);
    map.current = m;
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geomKey]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!value) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const pos: L.LatLngExpression = [value.latitude, value.longitude];
    if (marker.current) {
      marker.current.setLatLng(pos);
    } else {
      const card = cssVar("--card");
      marker.current = L.marker(pos, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:${cssVar("--primary")};width:22px;height:22px;border-radius:999px 999px 999px 0;transform:rotate(-45deg);border:3px solid ${card};box-shadow:0 4px 12px rgba(0,0,0,.3)"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 20],
        }),
      }).addTo(m);
    }
  }, [value]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="Tap the map to pin where you noticed the concern" />;
}
