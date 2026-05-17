import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const MapView = ({ data }: { data: { lat: number; lng: number; zoom?: number; label?: string } }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      center: [data.lat, data.lng],
      zoom: data.zoom ?? 12,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    L.circleMarker([data.lat, data.lng], {
      radius: 8,
      color: "#00c8ff",
      fillColor: "#00c8ff",
      fillOpacity: 0.6,
      weight: 2,
    }).addTo(map);
    mapRef.current = map;
    (window as any).__merlinMap = map;
    return () => {
      map.remove();
      mapRef.current = null;
      (window as any).__merlinMap = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([data.lat, data.lng], data.zoom ?? 12, { duration: 1.4 });
    }
  }, [data.lat, data.lng, data.zoom]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={ref}
        className="w-full h-full"
        style={{
          filter: "saturate(1.4) hue-rotate(-5deg)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 55%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse at center, black 55%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 200px 40px rgba(3,9,18,1)" }}
      />
      {data.label && (
        <div
          className="absolute top-12 left-6 font-orbitron text-[11px] tracking-[4px]"
          style={{ color: "#c8e8ff", textShadow: "0 0 12px rgba(0,200,255,0.6)" }}
        >
          ◉ {data.label.toUpperCase()}
        </div>
      )}
    </div>
  );
};
