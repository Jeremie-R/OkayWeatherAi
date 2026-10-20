/**
 * Paints a Material tonal palette onto the app's CSS variables.
 *
 * The source is either Android's wallpaper ramps (via the native plugin) or
 * ramps generated from a colour the user picked — both arrive as the same
 * `{ accent1_600: "#...", ... }` shape, so this doesn't care which.
 *
 * The variables are the ones styles.css already defines, so every component
 * follows along without knowing this exists, and removing them restores the
 * stock palette exactly.
 *
 * Only the "material" style uses this. That style separates sections with
 * tonal fills instead of borders, so unlike the other styles it deliberately
 * sets the surface fills too — `--card` lands a step away from
 * `--background`, and styles.css drops the borders.
 */

/** CSS variable -> tonal shade, per resolved theme. */
const LIGHT_MAP: Record<string, string> = {
  "--background": "neutral1_10",
  "--foreground": "neutral1_900",
  "--card": "accent2_50",
  "--card-foreground": "neutral1_900",
  "--popover": "neutral1_0",
  "--popover-foreground": "neutral1_900",
  "--primary": "accent1_600",
  "--primary-foreground": "accent1_0",
  "--secondary": "accent2_100",
  "--secondary-foreground": "accent1_900",
  "--muted": "accent2_100",
  "--muted-foreground": "neutral2_600",
  "--accent": "accent2_100",
  "--accent-foreground": "accent1_900",
  "--input": "neutral2_200",
  "--ring": "accent1_600",
};

const DARK_MAP: Record<string, string> = {
  "--background": "neutral1_900",
  "--foreground": "neutral1_50",
  "--card": "neutral2_800",
  "--card-foreground": "neutral1_50",
  "--popover": "neutral1_800",
  "--popover-foreground": "neutral1_50",
  "--primary": "accent1_200",
  "--primary-foreground": "accent1_800",
  "--secondary": "accent2_800",
  "--secondary-foreground": "accent1_100",
  "--muted": "accent2_800",
  "--muted-foreground": "neutral2_300",
  "--accent": "accent2_800",
  "--accent-foreground": "accent1_100",
  "--input": "neutral2_700",
  "--ring": "accent1_300",
};

const ALL_VARS = Array.from(new Set([...Object.keys(LIGHT_MAP), ...Object.keys(DARK_MAP)]));

export function applyMaterialPalette(
  colors: Record<string, string>,
  resolved: "light" | "dark",
): void {
  if (typeof document === "undefined") return;
  const map = resolved === "dark" ? DARK_MAP : LIGHT_MAP;
  const style = document.documentElement.style;
  for (const [cssVar, shade] of Object.entries(map)) {
    const value = colors[shade];
    // A missing shade leaves that variable on the stylesheet's value rather
    // than blanking it, so a partial palette can't break the theme.
    if (value) style.setProperty(cssVar, value);
  }
}

export function clearMaterialPalette(): void {
  if (typeof document === "undefined") return;
  const style = document.documentElement.style;
  for (const cssVar of ALL_VARS) style.removeProperty(cssVar);
}
