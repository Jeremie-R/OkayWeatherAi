import { useEffect, useState } from "react";
import { Search, Clock, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { geocode, type GeoResult } from "@/lib/owm";
import { getRecent, fromGeo, type SavedLocation } from "@/lib/geo";

export function LocationSheet({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (loc: SavedLocation) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [recent, setRecent] = useState<SavedLocation[]>([]);

  useEffect(() => {
    if (open) setRecent(getRecent());
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      const r = await geocode(q);
      setResults(r);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  function pick(loc: SavedLocation) {
    onSelect(loc);
    setQ("");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="rounded-b-3xl">
        <SheetHeader>
          <SheetTitle className="text-left">Change location</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-11 rounded-full"
            />
          </div>

          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => pick(fromGeo(r))}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-muted/60"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted-foreground">
                        {r.state ? `, ${r.state}` : ""}, {r.country}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : recent.length > 0 ? (
            <div>
              <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent
              </div>
              <ul className="space-y-1">
                {recent.map((l, i) => (
                  <li key={i}>
                    <button
                      onClick={() => pick(l)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-muted/60"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">{l.name}</span>
                        <span className="text-muted-foreground">
                          {l.state ? `, ${l.state}` : ""}, {l.country}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="px-3 text-sm text-muted-foreground">
              Try a city name like "Amsterdam" or "Tokyo".
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}