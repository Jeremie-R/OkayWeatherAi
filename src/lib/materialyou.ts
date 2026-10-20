/**
 * Paints Android's wallpaper palette onto the app's CSS variables.
 *
 * The variables are the same ones styles.css defines, so every component
 * follows along without knowing this exists. Values are written inline on
 * <html>, which outranks the stylesheet, and removing them restores the
 * stock palette exactly.
 */

/** CSS variable -> Material You shade, per resolved theme. */
const LIGHT_MAP: Record<string, string> = {
  "--background": "neutral1_10",
  "--foreground": "neutral1_900",
  "--card": "neutral1_0",
  "--card-foreground": "neutral1_900",
  "--popover": "neutral1_0",
  "--popover-foreground": "neutral1_900",
  "--primary": "accent1_600",
  "--primary-foreground": "accent1_0",
  "--secondary": "accent2_100",
  "--secondary-foreground": "accent1_900",
  "--muted": "neutral2_100",
  "--muted-foreground": "neutral2_600",
  "--accent": "accent2_100",
  "--accent-foreground": "accent1_900",
  "--border": "neutral2_200",
  "--input": "neutral2_200",
  "--ring": "accent1_600",
  // Deliberately not the 100s: they are near-white on most wallpapers and
  // flatten the frosted gradient into a single tone.
  "--surface-grad-1": "accent1_200",
  "--surface-grad-2": "accent3_200",
  "--surface-grad-3": "accent2_100",
};

const DARK_MAP: Record<string, string> = {
  "--background": "neutral1_900",
  "--foreground": "neutral1_50",
  "--card": "neutral1_800",
  "--card-foreground": "neutral1_50",
  "--popover": "neutral1_800",
  "--popover-foreground": "neutral1_50",
  "--primary": "accent1_200",
  "--primary-foreground": "accent1_800",
  "--secondary": "accent2_800",
  "--secondary-foreground": "accent1_100",
  "--muted": "neutral2_800",
  "--muted-foreground": "neutral2_300",
  "--accent": "accent2_800",
  "--accent-foreground": "accent1_100",
  "--border": "neutral2_700",
  "--input": "neutral2_700",
  "--ring": "accent1_300",
  "--surface-grad-1": "accent1_800",
  "--surface-grad-2": "accent3_900",
  "--surface-grad-3": "neutral1_900",
};

const ALL_VARS = Array.from(new Set([...Object.keys(LIGHT_MAP), ...Object.keys(DARK_MAP)]));

/**
 * The variables that carry a surface *fill*. The frosted style makes these
 * translucent in CSS; an inline value from here would be opaque and would win
 * on specificity, silently turning the glass back into plain cards — and an
 * opaque --background hides the gradient entirely. So under frosted we leave
 * them alone and only recolour foregrounds, accents and the gradient.
 */
const SURFACE_FILL_VARS = new Set([
  "--background",
  "--card",
  "--popover",
  "--muted",
  "--border",
  "--input",
]);

export function applyMaterialYou(
  colors: Record<string, string>,
  resolved: "light" | "dark",
  surface: "solid" | "frosted",
): void {
  if (typeof document === "undefined") return;
  const map = resolved === "dark" ? DARK_MAP : LIGHT_MAP;
  const style = document.documentElement.style;
  for (const [cssVar, shade] of Object.entries(map)) {
    if (surface === "frosted" && SURFACE_FILL_VARS.has(cssVar)) {
      style.removeProperty(cssVar);
      continue;
    }
    const value = colors[shade];
    // A missing shade leaves that variable on the stylesheet's value rather
    // than blanking it, so a partial palette can't break the theme.
    if (value) style.setProperty(cssVar, value);
  }
}

export function clearMaterialYou(): void {
  if (typeof document === "undefined") return;
  const style = document.documentElement.style;
  for (const cssVar of ALL_VARS) style.removeProperty(cssVar);
}
