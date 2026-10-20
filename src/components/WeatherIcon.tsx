import { useSettings } from "@/hooks/use-settings";
import { ICON_PACKS, type IconPack } from "@/lib/settings";

// Each pack is keyed by OpenWeatherMap icon code (01d, 10n, ...) and carries
// the same 18 files, so switching is a straight lookup swap.
//   modern  - rounded gradient set, the app's default
//   candy   - glossier set with radial gradients (OkayWeatherV2 "Weather new")
//   classic - the original OkayWeather set, flat and geometric
const modules: Record<IconPack, Record<string, string>> = {
  modern: import.meta.glob("../assets/weather-icons-modern/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  }) as Record<string, string>,
  candy: import.meta.glob("../assets/weather-icons-candy/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  }) as Record<string, string>,
  classic: import.meta.glob("../assets/weather-icons-classic/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  }) as Record<string, string>,
};

function byCode(mod: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [path, url] of Object.entries(mod)) {
    const name = path.split("/").pop()!.replace(".svg", "");
    map[name] = url;
  }
  return map;
}

const PACKS = Object.fromEntries(ICON_PACKS.map((pack) => [pack, byCode(modules[pack])])) as Record<
  IconPack,
  Record<string, string>
>;

/** Resolve a code to a URL in a given pack, falling back to clear-day. */
export function weatherIconUrl(code: string, pack: IconPack): string {
  const map = PACKS[pack] ?? PACKS.modern;
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
