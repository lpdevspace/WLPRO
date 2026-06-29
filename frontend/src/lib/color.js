// Convert a hex color (#RRGGBB) into an HSL triplet string "H S% L%"
// suitable for our CSS variables (used by Tailwind as hsl(var(--x))).
export function hexToHslString(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rf = r / 255,
    gf = g / 255,
    bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf:
        h = (gf - bf) / d + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = (bf - rf) / d + 2;
        break;
      default:
        h = (rf - gf) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hexToRgb(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// Returns "0 0% 0%" (black) or "0 0% 100%" (white) for best contrast.
export function contrastForeground(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "0 0% 0%" : "0 0% 100%";
}

export const ACCENT_PRESETS = [
  "#2D6A4F",
  "#D4FF00",
  "#B2A478",
  "#2563EB",
  "#E11D48",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#10B981",
];
