/**
 * Builds Material-style tonal ramps from a single seed colour.
 *
 * Android hands us its wallpaper ramps directly; this produces the same
 * shape (`accent1_600`, `neutral1_10`, ...) for a colour the user picked, so
 * everything downstream treats the two identically.
 *
 * The work happens in OKLCH — perceptually even lightness steps, which is
 * what a tonal ramp wants — rather than pulling in a colour library.
 */

/** Shade -> lightness. Shade 0 is lightest, matching Android's numbering. */
const SHADE_LIGHTNESS: Record<number, number> = {
  0: 1.0,
  10: 0.985,
  50: 0.95,
  100: 0.9,
  200: 0.82,
  300: 0.74,
  600: 0.5,
  700: 0.42,
  800: 0.34,
  900: 0.26,
};

const SHADES = Object.keys(SHADE_LIGHTNESS).map(Number);

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, v));
}

export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { l: 0.6, c: 0.1, h: 280 };
  const int = parseInt(m[1], 16);
  const r = srgbToLinear(((int >> 16) & 255) / 255);
  const g = srgbToLinear(((int >> 8) & 255) / 255);
  const b = srgbToLinear((int & 255) / 255);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  return {
    l: L,
    c: Math.sqrt(A * A + B * B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  };
}

export function oklchToHex(l: number, c: number, h: number): string {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);

  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;

  const r = linearToSrgb(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
  const g = linearToSrgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
  const b = linearToSrgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_);

  const to255 = (v: number) => Math.round(v * 255);
  return `#${((to255(r) << 16) | (to255(g) << 8) | to255(b)).toString(16).padStart(6, "0")}`;
}

/**
 * Chroma can't survive near white or black — pushing it there just clips to
 * a muddy colour — so taper it towards both ends of the ramp.
 */
function taper(chroma: number, lightness: number): number {
  const d = Math.abs(2 * lightness - 1);
  return chroma * (1 - d * d);
}

function ramp(out: Record<string, string>, name: string, hue: number, chroma: number): void {
  for (const shade of SHADES) {
    const l = SHADE_LIGHTNESS[shade];
    out[`${name}_${shade}`] = oklchToHex(l, taper(chroma, l), hue);
  }
}

/**
 * The five ramps the stylesheet mapping expects, matching how Android splits
 * them: accent1 is the seed, accent2 a muted version, accent3 a shifted hue,
 * and the neutrals carry just a hint of it.
 */
export function paletteFromSeed(seedHex: string): Record<string, string> {
  const { c, h } = hexToOklch(seedHex);
  // Keep a usable amount of colour even if the seed is nearly grey.
  const chroma = Math.min(Math.max(c, 0.07), 0.16);
  const out: Record<string, string> = {};
  ramp(out, "accent1", h, chroma);
  ramp(out, "accent2", h, chroma * 0.34);
  ramp(out, "accent3", (h + 60) % 360, chroma * 0.9);
  ramp(out, "neutral1", h, 0.008);
  ramp(out, "neutral2", h, 0.018);
  return out;
}
