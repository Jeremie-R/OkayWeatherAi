import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { LocationSheet } from "@/components/LocationSheet";
import { TimeSlider } from "@/components/TimeSlider";
import { fetchRainViewerFrames } from "@/lib/rainviewer";
import { getLast, setLast, saveRecent, type SavedLocation } from "@/lib/geo";

const MapPrecipitation = lazy(() =>
  import("@/components/MapPrecipitation").then((m) => ({ default: m.MapPrecipitation })),
);

export const Route = createFileRoute("/_tabs/map")({
  head: () => ({
    meta: [
      { title: "Map — OkayWeather" },
      { name: "description", content: "Precipitation radar with a time slider." },
    ],
  }),
  component: MapPage,
});

const DEFAULT_LOCATION: SavedLocation = {
  name: "Amsterdam",
  country: "NL",
  lat: 52.3676,
  lon: 4.9041,
};

function MapPage() {
  const [location, setLocation] = useState<SavedLocation>(() => getLast() ?? DEFAULT_LOCATION);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [frameIdx, setFrameIdx] = useState<number | null>(null);

  useEffect(() => setMounted(true), []);

  const q = useQuery({
    queryKey: ["rainviewer"],
    queryFn: fetchRainViewerFrames,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Initialize / clamp the active frame when data arrives
  useEffect(() => {
    if (!q.data) return;
    if (frameIdx == null || frameIdx >= q.data.frames.length) {
      // Start at "now" so future (nowcast) frames are visible to the right.
      setFrameIdx(Math.min(q.data.frames.length - 1, q.data.nowIndex));
    }
  }, [q.data, frameIdx]);

  function handleSelect(loc: SavedLocation) {
    setLocation(loc);
    setLast(loc);
    saveRecent(loc);
  }

  const tzOffsetSec = -new Date().getTimezoneOffset() * 60;
  const activeFrame = q.data && frameIdx != null ? q.data.frames[frameIdx] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[480px]">
        <Header
          name={`${location.name}, Map`}
          onClick={() => setSheetOpen(true)}
        />

        <div className="space-y-4 px-5 pb-10">
          {mounted ? (
            <Suspense fallback={<MapSkeleton />}>
              <MapPrecipitation
                lat={location.lat}
                lon={location.lon}
                host={q.data?.host ?? ""}
                framePath={activeFrame?.path ?? ""}
              />
            </Suspense>
          ) : (
            <MapSkeleton />
          )}

          <div className="rounded-3xl border border-border/60 bg-card p-4">
            {q.isLoading && (
              <p className="text-xs text-muted-foreground">Loading radar…</p>
            )}
            {q.isError && (
              <p className="text-xs text-muted-foreground">Couldn't load radar data.</p>
            )}
            {q.data && frameIdx != null && (
              <TimeSlider
                frames={q.data.frames}
                nowIndex={q.data.nowIndex}
                index={frameIdx}
                onChange={setFrameIdx}
                tzOffsetSec={tzOffsetSec}
              />
            )}
          </div>

          <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
            Radar from RainViewer · Base map © OpenStreetMap contributors, © CARTO
          </p>
        </div>

        <LocationSheet open={sheetOpen} onOpenChange={setSheetOpen} onSelect={handleSelect} />
      </div>
    </div>
  );
}

function MapSkeleton() {
  return <div className="h-[420px] w-full rounded-3xl border border-border/60 bg-muted/40" />;
}