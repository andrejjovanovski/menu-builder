export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  appearance: "minimal" | "visual";
  backgroundColor: string;
  cardBgColor: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  backgroundImageUrl?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "midnight-lounge",
    name: "Midnight Lounge",
    description: "Warm dark with gold accent — cocktail bars, wine rooms.",
    appearance: "minimal",
    backgroundColor: "#0d0a08",
    cardBgColor: "#1a1612",
    accentColor: "#d4af37",
    textColor: "#f5f0e8",
    mutedTextColor: "#8c857d",
  },
  {
    id: "sunlit-cafe",
    name: "Sunlit Café",
    description: "Bright cream and caramel — daytime cafés, bakeries.",
    appearance: "minimal",
    backgroundColor: "#f8f3ec",
    cardBgColor: "#ffffff",
    accentColor: "#c47a3d",
    textColor: "#2d2419",
    mutedTextColor: "#7a6b5d",
  },
  {
    id: "brutalist-black",
    name: "Brutalist Black",
    description: "Black, white, signal red — edgy, modern, statement.",
    appearance: "minimal",
    backgroundColor: "#000000",
    cardBgColor: "#0a0a0a",
    accentColor: "#ff3b30",
    textColor: "#ffffff",
    mutedTextColor: "#777777",
  },
  {
    id: "tokyo-neon",
    name: "Tokyo Neon",
    description: "Deep navy with hot pink — late-night vibe, kitchens, izakaya.",
    appearance: "minimal",
    backgroundColor: "#0a0e1a",
    cardBgColor: "#141a2e",
    accentColor: "#ff2e93",
    textColor: "#ffffff",
    mutedTextColor: "#8a91a8",
  },
  {
    id: "mediterranean-beach",
    name: "Mediterranean Beach",
    description: "Soft sky blue and white — coastal, breezy, daytime.",
    appearance: "minimal",
    backgroundColor: "#f0f6fa",
    cardBgColor: "#ffffff",
    accentColor: "#1e6ea6",
    textColor: "#0d2a40",
    mutedTextColor: "#5a7a92",
  },
];

export interface ThemePresetMatchInput {
  appearance: "minimal" | "visual";
  backgroundColor: string;
  cardBgColor: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
}

/**
 * Returns the id of the preset that matches the supplied draft, or null if
 * the draft is a custom combination. Comparisons are case-insensitive on
 * hex values.
 */
export function findMatchingPreset(draft: ThemePresetMatchInput): string | null {
  const normalize = (s: string) => s.trim().toLowerCase();
  for (const preset of THEME_PRESETS) {
    if (
      preset.appearance === draft.appearance &&
      normalize(preset.backgroundColor) === normalize(draft.backgroundColor) &&
      normalize(preset.cardBgColor) === normalize(draft.cardBgColor) &&
      normalize(preset.accentColor) === normalize(draft.accentColor) &&
      normalize(preset.textColor) === normalize(draft.textColor) &&
      normalize(preset.mutedTextColor) === normalize(draft.mutedTextColor)
    ) {
      return preset.id;
    }
  }
  return null;
}
