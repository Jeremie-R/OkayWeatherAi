import { Droplets, Wind } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WeatherIcon } from "./WeatherIcon";
import type { OneCallResponse } from "@/lib/owm";
import { localDayLabel, localHour, msToKmh } from "@/lib/weather";

export function DayDetailModal({
  data,
  dayIndex,
  onClose,
}: {
  data: OneCallResponse | null;
  dayIndex: number | null;
  onClose: () => void;
}) {
  const open = data != null && dayIndex != null;
  if (!open) {
    return (
      <Dialog open={false} onOpenChange={onClose}>
        <DialogContent />
      </Dialog>
    );
  }
  const day = data!.daily[dayIndex!];
  const tz = data!.timezone_offset;
  const targetDate = new Date((day.dt + tz) * 1000).toISOString().slice(0, 10);
  const hours = data!.hourly.filter(
    (h) => new Date((h.dt + tz) * 1000).toISOString().slice(0, 10) === targetDate,
  );
  const label = localDayLabel(day.dt, tz, dayIndex!);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-left">
            {label.short} <span className="text-sm font-normal text-muted-foreground">· {label.date}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <WeatherIcon code={day.weather[0].icon} size={48} />
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {Math.round(day.temp.min)}° / {Math.round(day.temp.max)}°
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {day.weather[0].description}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6">
          {hours.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hourly detail isn't available this far ahead.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {hours.map((h) => (
                <li key={h.dt} className="flex items-center gap-3 py-2">
                  <span className="w-12 text-sm tabular-nums text-muted-foreground">
                    {localHour(h.dt, tz).toString().padStart(2, "0")}h
                  </span>
                  <WeatherIcon code={h.weather[0].icon} size={28} />
                  <span className="flex-1 text-sm font-medium tabular-nums">
                    {Math.round(h.temp)}°
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      feels {Math.round(h.feels_like)}°
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Droplets className="h-3 w-3" />
                    {Math.round(h.pop * 100)}%
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Wind className="h-3 w-3" />
                    {Math.round(msToKmh(h.wind_speed))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}