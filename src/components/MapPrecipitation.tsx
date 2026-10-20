import { useEffect, useRef } from "react";
import L from "leaflet";
import { tileUrl } from "@/lib/rainviewer";

// CARTO basemaps require a key since 2026 — without it every tile is replaced
// by an "API KEY REQUIRED" placeholder. Free for non-commercial use up to 5M
// tiles/month; the attribution below the map is part of the terms.
// Keys are public by nature (they ship in the client); rotate at carto.com.
const CARTO_KEY = "cb1_4q2g_1_98925bfa962c131363c358e9";
const CARTO_BASEMAP = `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`;

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
      // RainViewer caps radar tiles at zoom 7; above that it serves a black
      // "Zoom Level Not Supported" placeholder over the whole map.
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(CARTO_BASEMAP, { subdomains: "abcd" }).addTo(map);
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
