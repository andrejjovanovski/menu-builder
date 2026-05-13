import {
  contrastRatio,
  hexToHsl,
  hslToHex,
  type WcagGrade,
} from "@/src/utils/color-utils";

export type PaletteVariant = "light" | "dark" | "vivid";

export interface DerivedPalette {
  variant: PaletteVariant;
  backgroundColor: string;
  cardBgColor: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  contrast: {
    text: number;
    muted: number;
    accent: number;
    grade: WcagGrade;
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Generate a coordinated 5-color palette from a single brand color.
 * Three variants tuned for different vibes:
 *   - light  → bright, cream-ish background; brand color stays as accent
 *   - dark   → near-black background gently tinted toward the brand hue
 *   - vivid  → moodier, more saturated; the brand color leaks into the background
 *
 * Each variant aims for AA-or-better text contrast against the background.
 */
export function derivePalette(brandHex: string, variant: PaletteVariant): DerivedPalette {
  const [h, s] = hexToHsl(brandHex);

  let backgroundColor: string;
  let cardBgColor: string;
  let textColor: string;
  let mutedTextColor: string;
  let accentColor = brandHex;

  if (variant === "light") {
    backgroundColor = hslToHex(h, clamp(s * 0.15, 0, 8), 96);
    cardBgColor = "#ffffff";
    textColor = hslToHex(h, clamp(s * 0.3, 0, 20), 12);
    mutedTextColor = hslToHex(h, clamp(s * 0.2, 0, 15), 45);
  } else if (variant === "dark") {
    backgroundColor = hslToHex(h, clamp(s * 0.3, 0, 15), 8);
    cardBgColor = hslToHex(h, clamp(s * 0.3, 0, 15), 14);
    textColor = hslToHex(h, clamp(s * 0.1, 0, 5), 95);
    mutedTextColor = hslToHex(h, clamp(s * 0.18, 0, 12), 65);
  } else {
    // vivid
    backgroundColor = hslToHex(h, clamp(s * 0.55, 10, 35), 11);
    cardBgColor = hslToHex(h, clamp(s * 0.5, 10, 30), 18);
    accentColor = hslToHex(h, clamp(s * 1.1, 60, 95), 60);
    textColor = hslToHex(h, clamp(s * 0.18, 0, 12), 95);
    mutedTextColor = hslToHex(h, clamp(s * 0.3, 0, 22), 70);
  }

  const text = contrastRatio(textColor, backgroundColor);
  const muted = contrastRatio(mutedTextColor, backgroundColor);
  const accent = contrastRatio(accentColor, backgroundColor);

  // Worst-case grade: take the lowest of text vs muted (we don't enforce on accent).
  const worst = Math.min(text, muted);
  const grade: WcagGrade =
    worst >= 7 ? "AAA" : worst >= 4.5 ? "AA" : worst >= 3 ? "AA Large" : "Fail";

  return {
    variant,
    backgroundColor,
    cardBgColor,
    accentColor,
    textColor,
    mutedTextColor,
    contrast: { text, muted, accent, grade },
  };
}

export function deriveAllVariants(brandHex: string): DerivedPalette[] {
  return ["light", "dark", "vivid"].map((variant) =>
    derivePalette(brandHex, variant as PaletteVariant)
  );
}
