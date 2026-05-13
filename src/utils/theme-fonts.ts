import {
  Bebas_Neue,
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Inter,
  Manrope,
  Playfair_Display,
} from "next/font/google";

// Each font is loaded once and exposes a CSS variable name. Add the font's
// `.variable` className to any parent and `var(--font-...)` works inside.
export const fontInter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
export const fontPlayfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});
export const fontManrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});
export const fontDmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});
export const fontDmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-serif",
});
export const fontBebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});
export const fontCormorant = Cormorant_Garamond({
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
});

// Combined className containing every font's CSS variable. Apply this to a
// parent element (e.g. the public menu wrapper) so all variables are
// resolvable from any descendant.
export const ALL_FONTS_CLASS = [
  fontInter.variable,
  fontPlayfair.variable,
  fontManrope.variable,
  fontDmSans.variable,
  fontDmSerifDisplay.variable,
  fontBebasNeue.variable,
  fontCormorant.variable,
].join(" ");

export interface FontPair {
  id: string;
  name: string;
  description: string;
  // CSS values that resolve via the variables above (e.g. "var(--font-inter)").
  displayCss: string;
  bodyCss: string;
  // Display strings for the picker UI (so we render each pair's name in its
  // actual font without re-loading anything).
  displayPreviewName: string;
  bodyPreviewName: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Editorial elegance — fine dining, old-world charm.",
    displayCss: `var(--font-playfair), serif`,
    bodyCss: `var(--font-inter), system-ui, sans-serif`,
    displayPreviewName: "Playfair Display",
    bodyPreviewName: "Inter",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean, contemporary, single-family — speciality cafés.",
    displayCss: `var(--font-manrope), system-ui, sans-serif`,
    bodyCss: `var(--font-manrope), system-ui, sans-serif`,
    displayPreviewName: "Manrope",
    bodyPreviewName: "Manrope",
  },
  {
    id: "bistro",
    name: "Bistro",
    description: "Warm serif headings, friendly grotesk body — bistros, brunch.",
    displayCss: `var(--font-dm-serif), serif`,
    bodyCss: `var(--font-dm-sans), system-ui, sans-serif`,
    displayPreviewName: "DM Serif Display",
    bodyPreviewName: "DM Sans",
  },
  {
    id: "statement",
    name: "Statement",
    description: "Bold condensed caps for impact — cocktail bars, late-night.",
    displayCss: `var(--font-bebas), Impact, sans-serif`,
    bodyCss: `var(--font-inter), system-ui, sans-serif`,
    displayPreviewName: "Bebas Neue",
    bodyPreviewName: "Inter",
  },
  {
    id: "refined",
    name: "Refined",
    description: "High-contrast garamond — wine bars, hotels, venues with history.",
    displayCss: `var(--font-cormorant), serif`,
    bodyCss: `var(--font-inter), system-ui, sans-serif`,
    displayPreviewName: "Cormorant Garamond",
    bodyPreviewName: "Inter",
  },
];

export const DEFAULT_FONT_PAIR_ID = "classic";

export function getFontPair(id: string | null | undefined): FontPair {
  return (
    FONT_PAIRS.find((pair) => pair.id === id) ??
    FONT_PAIRS.find((pair) => pair.id === DEFAULT_FONT_PAIR_ID)!
  );
}
