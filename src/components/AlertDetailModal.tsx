import { useEffect } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import type { OwmAlert } from "@/lib/owm";

export function AlertDetailModal({
  alerts,
  open: openProp,
  tzOffset,
  onClose,
}: {
  alerts: OwmAlert[] | null;
  open: boolean;
  tzOffset: number;
  onClose: () => void;
}) {
  const open = openProp && alerts != null && alerts.length > 0;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const list = alerts!;
  const title =
    list.length === 1 ? "Weather alert" : `${list.length} weather alerts`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background animate-in fade-in duration-150">
      <div className="mx-auto max-w-[480px] pb-12">
        <header className="sticky top-0 z-10 flex items-center gap-2 bg-background/90 backdrop-blur px-3 pt-4 pb-3 border-b border-border/60">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="ml-auto mr-3 text-right">
            <p className="text-sm font-semibold">{title}</p>
          </div>
        </header>

        {list.map((a, i) => (
          <div key={`${a.event}-${a.start}-${i}`}>
            <section className="px-5 pt-5">
              <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-foreground/70" />
                  <div className="min-w-0">
                    <h1 className="text-xl font-semibold leading-tight">{a.event}</h1>
                    {a.sender_name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Issued by {a.sender_name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {formatRange(a.start, a.end, tzOffset)}
                    </p>
                  </div>
                </div>

                {a.tags && a.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="px-5 pt-4">
              <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-sm">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {a.description || "No further details provided."}
                </p>
              </div>
            </section>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatRange(start: number, end: number, tzOffset: number): string {
  const fmt = (unix: number) => {
    const d = new Date((unix + tzOffset) * 1000);
    const day = d.toUTCString().slice(0, 3);
    const hh = d.getUTCHours().toString().padStart(2, "0");
    const mm = d.getUTCMinutes().toString().padStart(2, "0");
    const date = d.getUTCDate();
    const month = d.toUTCString().slice(8, 11);
    return `${day} ${date} ${month}, ${hh}:${mm}`;
  };
  return `${fmt(start)} → ${fmt(end)}`;
}