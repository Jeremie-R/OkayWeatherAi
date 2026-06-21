import { AlertTriangle, ChevronRight } from "lucide-react";
import type { OwmAlert } from "@/lib/owm";

export function AlertRail({
  alerts,
  onOpen,
}: {
  alerts?: OwmAlert[];
  onOpen: (index: number) => void;
}) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="px-5 space-y-2">
      {alerts.map((a, i) => (
        <button
          key={`${a.event}-${a.start}-${i}`}
          onClick={() => onOpen(i)}
          className="group flex w-full items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 h-11 text-left transition hover:bg-muted/60"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-foreground/70" />
          <span className="truncate text-sm font-medium text-foreground">
            {a.event}
          </span>
          {a.sender_name && (
            <span className="ml-1 hidden truncate text-xs text-muted-foreground sm:inline">
              · {a.sender_name}
            </span>
          )}
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  );
}