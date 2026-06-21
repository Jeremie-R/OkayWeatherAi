import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { RainViewerFrame } from "@/lib/rainviewer";

interface Props {
  frames: RainViewerFrame[];
  nowIndex: number;
  index: number;
  onChange: (i: number) => void;
  tzOffsetSec: number;
}

export function TimeSlider({ frames, nowIndex, index, onChange, tzOffsetSec }: Props) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      onChange((index + 1) % frames.length);
    }, 600);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, index, frames.length, onChange]);

  if (!frames.length) return null;
  const current = frames[index];
  const nowFrame = frames[Math.max(0, Math.min(frames.length - 1, nowIndex))];
  const deltaMin = Math.round((current.time - nowFrame.time) / 60);
  const nowPct = (nowIndex / Math.max(1, frames.length - 1)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatRel(deltaMin)}</span>
        <span className="font-mono tabular-nums text-foreground">
          {formatClock(current.time, tzOffsetSec)}
        </span>
        <button
          type="button"
          onClick={() => {
            setPlaying((p) => !p);
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          step={1}
          value={index}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
          className="w-full accent-foreground"
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/40"
          style={{ left: `${nowPct}%` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{Math.round((frames[0].time - nowFrame.time) / 60)}m</span>
        <span>now</span>
        <span>+{Math.round((frames[frames.length - 1].time - nowFrame.time) / 60)}m</span>
      </div>
    </div>
  );
}

function formatRel(min: number) {
  if (min === 0) return "now";
  if (min > 0) return `+${min} min`;
  return `${min} min`;
}

function formatClock(unix: number, tzOffsetSec: number) {
  const d = new Date((unix + tzOffsetSec) * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}