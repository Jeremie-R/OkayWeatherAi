import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOneCall, reverseGeocode } from "@/lib/owm";
import { fetchOpenMeteoHourly } from "@/lib/openmeteo";
import { fetchAirQuality } from "@/lib/airquality";
import { getLast, setLast, saveRecent, type SavedLocation } from "@/lib/geo";
import { Header } from "@/components/Header";
import { LocationSheet } from "@/components/LocationSheet";
import { TodaySection } from "@/components/TodaySection";
import { TomorrowSection } from "@/components/TomorrowSection";
import { TenDaySection } from "@/components/TenDaySection";
import { DayDetailModal } from "@/components/DayDetailModal";
import { AlertRail } from "@/components/AlertRail";
import { AlertDetailModal } from "@/components/AlertDetailModal";

export const Route = createFileRoute("/_tabs/")({
  head: () => ({
    meta: [
      { title: "OkayWeather — Honest forecasts" },
      { name: "description", content: "A simple, modern weather app with a sense of humor." },
      { property: "og:title", content: "OkayWeather" },
      { property: "og:description", content: "A simple, modern weather app with a sense of humor." },
    ],
  }),
  component: Index,
});

const DEFAULT_LOCATION: SavedLocation = {
  name: "Amsterdam",
  country: "NL",
  lat: 52.3676,
  lon: 4.9041,
};

function Index() {
  const [location, setLocation] = useState<SavedLocation>(() => getLast() ?? DEFAULT_LOCATION);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Try geolocation on first load only if user hasn't picked one before
  useEffect(() => {
    if (getLast()) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (r) {
          const loc: SavedLocation = {
            name: r.name,
            country: r.country,
            state: r.state,
            lat: r.lat,
            lon: r.lon,
          };
          setLocation(loc);
          setLast(loc);
        }
      },
      () => {},
      { timeout: 5000 },
    );
  }, []);

  const query = useQuery({
    queryKey: ["weather", location.lat, location.lon],
    queryFn: async () => {
      const [owm, om, aqi] = await Promise.all([
        fetchOneCall(location.lat, location.lon),
        fetchOpenMeteoHourly(location.lat, location.lon).catch((e) => {
          console.warn("Open-Meteo fetch failed", e);
          return null;
        }),
        fetchAirQuality(location.lat, location.lon).catch((e) => {
          console.warn("Air quality fetch failed", e);
          return null;
        }),
      ]);
      return { owm, om, aqi };
    },
    staleTime: 10 * 60 * 1000,
  });

  function handleSelect(loc: SavedLocation) {
    setLocation(loc);
    setLast(loc);
    saveRecent(loc);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[480px]">
        <Header
          name={`${location.name}, Today`}
          onClick={() => setSheetOpen(true)}
        />

        {query.isLoading && <LoadingState />}
        {query.isError && (
          <ErrorState onRetry={() => query.refetch()} message={(query.error as Error).message} />
        )}
        {query.data && (
          <div className="space-y-5 pb-10">
            <AlertRail alerts={query.data.owm.alerts} onOpen={() => setAlertsOpen(true)} />
            <TodaySection data={query.data.owm} locName={location.name} onOpenDay={() => setOpenDay(0)} />
            <TomorrowSection data={query.data.owm} onOpenDetails={(i) => setOpenDay(i)} />
            <TenDaySection data={query.data.owm} onOpenDay={(i) => setOpenDay(i)} />
          </div>
        )}

        <LocationSheet open={sheetOpen} onOpenChange={setSheetOpen} onSelect={handleSelect} />
        <DayDetailModal
          data={query.data?.owm ?? null}
          omHourly={query.data?.om?.hourly ?? null}
          aqi={query.data?.aqi ?? null}
          dayIndex={openDay}
          onClose={() => setOpenDay(null)}
        />
        <AlertDetailModal
          alerts={query.data?.owm.alerts ?? null}
          open={alertsOpen}
          tzOffset={query.data?.owm.timezone_offset ?? 0}
          onClose={() => setAlertsOpen(false)}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 px-5">
      {[180, 120, 100, 240].map((h, i) => (
        <div
          key={i}
          className="rounded-3xl border border-border/60 bg-card"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="mx-5 rounded-3xl border border-border/60 bg-card p-6 text-center">
      <p className="text-sm font-medium">Couldn't load the forecast</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
