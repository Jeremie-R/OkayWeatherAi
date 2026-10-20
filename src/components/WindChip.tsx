import { Wind } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { windLabel } from "@/lib/weather";
import { formatWind } from "@/lib/units";

export function WindChip({ kmh, showSpeed = false }: { kmh: number; showSpeed?: boolean }) {
  const { settings } = useSettings();
  const label = windLabel(kmh);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Wind className="h-3.5 w-3.5" />
      {label}
      {showSpeed && (
        <span className="text-muted-foreground/70">· {formatWind(kmh, settings.wind)}</span>
      )}
    </span>
  );
}
