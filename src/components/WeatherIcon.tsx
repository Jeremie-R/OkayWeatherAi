import { useSettings } from "@/hooks/use-settings";
import type { IconPack } from "@/lib/settings";

// Both packs are keyed by OpenWeatherMap icon code (01d, 10n, ...) and carry
// the same 18 files, so switching is a straight lookup swap.
//   candy   - the rounded gradient set, the app's default
//   classic - the original OkayWeather set (flat geometric, circa 2020)
const candy = import.meta.glob("../assets/weather-icons/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const classic = import.meta.glob("../assets/weather-icons-classic/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function byCode(mod: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [path, url] of Object.entries(mod)) {
    const name = path.split("/").pop()!.replace(".svg", "");
    map[name] = url;
  }
  return map;
}

const PACKS: Record<IconPack, Record<string, string>> = {
  candy: byCode(candy),
  classic: byCode(classic),
};

/** Resolve a code to a URL in a given pack, falling back to clear-day. */
export function weatherIconUrl(code: string, pack: IconPack): string {
  const map = PACKS[pack] ?? PACKS.candy;
  return map[code] ?? map["01d"];
}

export function WeatherIcon({
  code,
  size = 56,
  className,
  alt,
  pack,
}: {
  code: string;
  size?: number;
  className?: string;
  alt?: string;
  /** Override the user's pack — used by the icon picker in Settings. */
  pack?: IconPack;
}) {
  const { settings } = useSettings();
  const src = weatherIconUrl(code, pack ?? settings.iconPack);
  return (
    <img
      src={src}
      alt={alt ?? code}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
