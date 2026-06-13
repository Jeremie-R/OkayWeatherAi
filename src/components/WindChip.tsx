import { Wind } from "lucide-react";
import { windLabel } from "@/lib/weather";

export function WindChip({ kmh, showSpeed = false }: { kmh: number; showSpeed?: boolean }) {
  const label = windLabel(kmh);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Wind className="h-3.5 w-3.5" />
      {label}
      {showSpeed && <span className="text-muted-foreground/70">· {Math.round(kmh)} km/h</span>}
    </span>
  );
}