// Tiny color utilities — no library dependency. All inputs/outputs are hex
// strings with a leading "#" except for the intermediate RGB/HSL tuples.

export type RGB = [number, number, number];
export type HSL = [number, number, number]; // h: 0–360, s/l: 0–100

export function isValidHex(input: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.trim());
}

export function normalizeHex(input: string): string {
  let hex = input.trim().replace(/^#/, "").toLowerCase();
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${hex}`;
}

export function hexToRgb(hex: string): RGB {
  const cleaned = normalizeHex(hex).replace("#", "");
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN:
        h = ((gN - bN) / d + (gN < bN ? 6 : 0)) / 6;
        break;
      case gN:
        h = ((bN - rN) / d + 2) / 6;
        break;
      case bN:
        h = ((rN - gN) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hN = ((h % 360) + 360) % 360 / 360;
  const sN = Math.max(0, Math.min(100, s)) / 100;
  const lN = Math.max(0, Math.min(100, l)) / 100;
  if (sN === 0) {
    const v = lN * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tN = t;
    if (tN < 0) tN += 1;
    if (tN > 1) tN -= 1;
    if (tN < 1 / 6) return p + (q - p) * 6 * tN;
    if (tN < 1 / 2) return q;
    if (tN < 2 / 3) return p + (q - p) * (2 / 3 - tN) * 6;
    return p;
  };
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;
  return [
    hue2rgb(p, q, hN + 1 / 3) * 255,
    hue2rgb(p, q, hN) * 255,
    hue2rgb(p, q, hN - 1 / 3) * 255,
  ];
}

export function hexToHsl(hex: string): HSL {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// WCAG 2.1 relative luminance.
function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const [light, dark] = lA > lB ? [lA, lB] : [lB, lA];
  return (light + 0.05) / (dark + 0.05);
}

export type WcagGrade = "AAA" | "AA" | "AA Large" | "Fail";

export function gradeContrast(ratio: number): WcagGrade {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}
