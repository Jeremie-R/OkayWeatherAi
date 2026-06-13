const icons = import.meta.glob("../assets/weather-icons/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const map: Record<string, string> = {};
for (const [path, url] of Object.entries(icons)) {
  const name = path.split("/").pop()!.replace(".svg", "");
  map[name] = url;
}

export function WeatherIcon({
  code,
  size = 56,
  className,
  alt,
}: {
  code: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const src = map[code] ?? map["01d"];
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