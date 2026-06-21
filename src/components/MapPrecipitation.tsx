import { useEffect, useRef } from "react";
import L from "leaflet";
import { tileUrl } from "@/lib/rainviewer";

interface Props {
  lat: number;
  lon: number;
  host: string;
  framePath: string;
}

export function MapPrecipitation({ lat, lon, host, framePath }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 6,
      minZoom: 4,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd" },
    ).addTo(map);
    markerRef.current = L.circleMarker([lat, lon], {
      radius: 6,
      color: "#0f172a",
      weight: 2,
      fillColor: "#0f172a",
      fillOpacity: 1,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      radarRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Recenter when location changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([lat, lon], mapRef.current.getZoom());
    markerRef.current?.setLatLng([lat, lon]);
  }, [lat, lon]);

  // Swap radar tile layer when frame changes
  useEffect(() => {
    if (!mapRef.current || !framePath) return;
    const url = tileUrl(host, framePath);
    const next = L.tileLayer(url, { opacity: 0.75 }).addTo(mapRef.current);
    const prev = radarRef.current;
    radarRef.current = next;
    // Remove prev once new tiles load to avoid flicker
    if (prev) {
      setTimeout(() => prev.remove(), 250);
    }
  }, [host, framePath]);

  return (
    <div
      ref={containerRef}
      className="map-precip relative isolate z-0 h-[420px] w-full rounded-3xl overflow-hidden border border-border/60"
    />
  );
}