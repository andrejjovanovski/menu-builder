"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Crown,
  ExternalLink,
  Eye,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { tierAtLeast } from "@/lib/subscription";
import { useDashboard } from "@/src/components/dashboard/DashboardProvider";
import RestaurantMenuClient from "@/src/components/public-menu/RestaurantMenuClient";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Toast, ToastType } from "@/src/components/ui/Toast";
import {
  MenuCategory,
  MenuItem,
  Promotion,
  Restaurant,
} from "@/src/types";
import {
  findMatchingPreset,
  THEME_PRESETS,
  type ThemePreset,
} from "@/src/utils/theme-presets";
import {
  ALL_FONTS_CLASS,
  DEFAULT_FONT_PAIR_ID,
  FONT_PAIRS,
  type FontPair,
} from "@/src/utils/theme-fonts";
import {
  contrastRatio,
  gradeContrast,
  isValidHex,
  normalizeHex,
  type WcagGrade,
} from "@/src/utils/color-utils";
import {
  deriveAllVariants,
  type DerivedPalette,
} from "@/src/utils/derive-palette";
import { extractLogoColors } from "@/src/utils/extract-logo-colors";

type CategoryWithItems = MenuCategory & { items: MenuItem[] };

interface AppearanceDraft {
  appearance: "minimal" | "visual";
  backgroundColor: string;
  accentColor: string;
  cardBgColor: string;
  textColor: string;
  mutedTextColor: string;
  backgroundImageUrl: string;
  fontPairId: string;
}

function restaurantToDraft(r: Restaurant): AppearanceDraft {
  return {
    appearance: (r.appearance ?? "minimal") as "minimal" | "visual",
    backgroundColor: r.background_color || "#161412",
    accentColor: r.accent_color || "#d4af37",
    cardBgColor: r.card_bg_color || "#211f1c",
    textColor: r.text_color || "#f5f3ef",
    mutedTextColor: r.muted_text_color || "#9b9590",
    backgroundImageUrl: r.background_image_url || "",
    fontPairId: r.font_pair_id || DEFAULT_FONT_PAIR_ID,
  };
}

function applyDraft(r: Restaurant, draft: AppearanceDraft): Restaurant {
  return {
    ...r,
    appearance: draft.appearance,
    background_color: draft.backgroundColor,
    accent_color: draft.accentColor,
    card_bg_color: draft.cardBgColor,
    text_color: draft.textColor,
    muted_text_color: draft.mutedTextColor,
    background_image_url: draft.backgroundImageUrl,
    font_pair_id: draft.fontPairId,
  };
}

export default function ThemeStudioPage() {
  const { selectedRestaurant, fetchRestaurants } = useDashboard();
  if (!selectedRestaurant) return null;

  const isPro = tierAtLeast(selectedRestaurant.subscription_tier ?? "basic", "pro");

  return isPro ? (
    <ThemeStudioContent restaurant={selectedRestaurant} onSaved={fetchRestaurants} />
  ) : (
    <UpgradeProCard />
  );
}

function UpgradeProCard() {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-indigo-50 to-white">
      <CardContent className="flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Palette className="h-7 w-7" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-xl font-semibold">Theme Studio</h3>
              <Badge variant="secondary" className="uppercase tracking-widest">Pro</Badge>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Customize colors, mode, and the entire feel of your public menu, with a
              live phone-frame preview that updates as you edit. Available on the Pro plan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Crown className="h-5 w-5" />
          <span className="text-sm font-semibold">Pro feature</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ThemeStudioContent({
  restaurant,
  onSaved,
}: {
  restaurant: Restaurant;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<AppearanceDraft>(() => restaurantToDraft(restaurant));
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Reset draft if the user switches restaurants while on this page.
  useEffect(() => {
    setDraft(restaurantToDraft(restaurant));
  }, [restaurant.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch real menu data so the preview shows the owner's actual menu.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [cats, items, proms] = await Promise.all([
          apiFetch<MenuCategory[]>(`/api/restaurants/${restaurant.slug}/categories`),
          apiFetch<{ items: MenuItem[] }>(
            `/api/restaurants/${restaurant.slug}/items?limit=200&offset=0`
          ),
          apiFetch<Promotion[]>(`/api/restaurants/${restaurant.slug}/promotions`).catch(
            () => [] as Promotion[]
          ),
        ]);
        if (cancelled) return;
        const itemsList = items?.items ?? [];
        const cwi: CategoryWithItems[] = (cats ?? []).map((c) => ({
          ...c,
          items: itemsList.filter((i) => i.category_id === c.id),
        }));
        setCategories(cwi);
        setPromotions(proms ?? []);
      } catch (error) {
        console.error("Failed to load preview data", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [restaurant.slug]);

  const previewRestaurant = useMemo(() => applyDraft(restaurant, draft), [restaurant, draft]);
  const isDirty = useMemo(() => {
    const original = restaurantToDraft(restaurant);
    return (Object.keys(draft) as (keyof AppearanceDraft)[]).some(
      (k) => draft[k] !== original[k]
    );
  }, [draft, restaurant]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/restaurants/${restaurant.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appearance: draft.appearance,
          background_color: draft.backgroundColor,
          accent_color: draft.accentColor,
          card_bg_color: draft.cardBgColor,
          text_color: draft.textColor,
          muted_text_color: draft.mutedTextColor,
          background_image_url: draft.backgroundImageUrl,
          font_pair_id: draft.fontPairId,
        }),
      });
      await onSaved();
      setToast({ message: "Theme saved", type: "success" });
    } catch (error) {
      console.error("Failed to save theme", error);
      setToast({ message: "Failed to save theme", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [draft, restaurant.slug, onSaved]);

  const handleReset = useCallback(() => {
    setDraft(restaurantToDraft(restaurant));
  }, [restaurant]);

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase tracking-widest">
                Theme Studio
              </Badge>
              <Badge variant="outline" className="uppercase tracking-widest">Pro</Badge>
            </div>
            <CardTitle className="mt-3 text-2xl">Make the menu match your venue</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Tweak colors and mode on the left. The phone preview on the right shows
              your real menu styled live as you edit.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open live menu
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty || saving}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={!isDirty || saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save theme
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,500px)]">
        <ThemeEditor
          draft={draft}
          onChange={setDraft}
          logoUrl={restaurant.logo_url ?? null}
        />
        <PreviewPanel
          restaurant={previewRestaurant}
          categoriesWithItems={categories}
          promotions={promotions}
          loading={loading}
        />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// --- Editor ---

function ThemeEditor({
  draft,
  onChange,
  logoUrl,
}: {
  draft: AppearanceDraft;
  onChange: (next: AppearanceDraft) => void;
  logoUrl: string | null;
}) {
  const update = <K extends keyof AppearanceDraft>(key: K, value: AppearanceDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const activePresetId = findMatchingPreset(draft);

  const applyDerived = (palette: DerivedPalette) => {
    onChange({
      ...draft,
      backgroundColor: palette.backgroundColor,
      cardBgColor: palette.cardBgColor,
      accentColor: palette.accentColor,
      textColor: palette.textColor,
      mutedTextColor: palette.mutedTextColor,
    });
  };

  const applyPreset = (preset: ThemePreset) => {
    onChange({
      appearance: preset.appearance,
      backgroundColor: preset.backgroundColor,
      cardBgColor: preset.cardBgColor,
      accentColor: preset.accentColor,
      textColor: preset.textColor,
      mutedTextColor: preset.mutedTextColor,
      backgroundImageUrl: preset.backgroundImageUrl ?? draft.backgroundImageUrl,
      fontPairId: draft.fontPairId,
    });
  };

  return (
    <div className="space-y-4">
      <BrandColorAuto
        brandHex={draft.accentColor}
        onApply={applyDerived}
        onPickBrandColor={(hex) => onChange({ ...draft, accentColor: hex })}
        logoUrl={logoUrl}
      />

      <SectionCard
        icon={<Wand2 className="h-5 w-5" />}
        title="Theme Presets"
        description="One-click looks. Pick a starting point, then tune to taste."
        action={
          activePresetId ? (
            <Badge variant="secondary" className="uppercase tracking-widest">
              {THEME_PRESETS.find((p) => p.id === activePresetId)?.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="uppercase tracking-widest">
              Custom
            </Badge>
          )
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {THEME_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              active={activePresetId === preset.id}
              onApply={() => applyPreset(preset)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={<Sparkles className="h-5 w-5" />}
        title="Mode"
        description="Choose how items render. Visual emphasizes images; Minimal is text-first."
      >
        <div className="grid grid-cols-2 gap-3">
          <ModeOption
            active={draft.appearance === "minimal"}
            label="Minimal"
            description="Text-driven, ultra-clean."
            onClick={() => update("appearance", "minimal")}
          />
          <ModeOption
            active={draft.appearance === "visual"}
            label="Visual"
            description="Image-led with background image."
            onClick={() => update("appearance", "visual")}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={<Palette className="h-5 w-5" />}
        title="Brand Colors"
        description="The base palette of the public menu."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ColorField
            label="Background"
            value={draft.backgroundColor}
            onChange={(v) => update("backgroundColor", v)}
          />
          <ColorField
            label="Card"
            value={draft.cardBgColor}
            onChange={(v) => update("cardBgColor", v)}
          />
          <ColorField
            label="Accent"
            value={draft.accentColor}
            onChange={(v) => update("accentColor", v)}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={<Sparkles className="h-5 w-5" />}
        title="Typography"
        description="Pick a curated font pair. Headings use the display font, body copy uses the body font."
        action={
          <Badge variant="outline" className="uppercase tracking-widest">
            {FONT_PAIRS.find((p) => p.id === draft.fontPairId)?.name ?? "Custom"}
          </Badge>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FONT_PAIRS.map((pair) => (
            <FontPairCard
              key={pair.id}
              pair={pair}
              active={draft.fontPairId === pair.id}
              onApply={() => update("fontPairId", pair.id)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={<Eye className="h-5 w-5" />}
        title="Text Colors"
        description="Make sure your text is legible against the background."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField
            label="Primary text"
            value={draft.textColor}
            onChange={(v) => update("textColor", v)}
          />
          <ColorField
            label="Muted text"
            value={draft.mutedTextColor}
            onChange={(v) => update("mutedTextColor", v)}
          />
        </div>
      </SectionCard>

      <AccessibilityPanel draft={draft} />

      {draft.appearance === "visual" && (
        <SectionCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Background Image"
          description="Used in Visual mode behind the entire menu."
        >
          <input
            type="url"
            value={draft.backgroundImageUrl}
            onChange={(event) => update("backgroundImageUrl", event.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            Tip: upload your image in Settings, then paste the URL here.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">{icon}</div>
          {action}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">{children}</CardContent>
    </Card>
  );
}

function PresetCard({
  preset,
  active,
  onApply,
}: {
  preset: ThemePreset;
  active: boolean;
  onApply: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onApply}
      className={`group relative overflow-hidden rounded-xl border text-left transition ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border/70 bg-background hover:border-primary/40"
      }`}
    >
      {/* Mini menu preview using the preset's actual colors */}
      <div
        className="relative h-24 w-full overflow-hidden"
        style={{ backgroundColor: preset.backgroundColor }}
      >
        {/* Mock card */}
        <div
          className="absolute left-3 top-3 h-[72px] w-[58%] rounded-md p-2 shadow-sm"
          style={{ backgroundColor: preset.cardBgColor }}
        >
          <div
            className="mb-1.5 h-2 w-3/4 rounded-full"
            style={{ backgroundColor: preset.textColor, opacity: 0.95 }}
          />
          <div
            className="mb-1.5 h-1.5 w-1/2 rounded-full"
            style={{ backgroundColor: preset.mutedTextColor }}
          />
          <div
            className="mt-2 h-2 w-10 rounded-full"
            style={{ backgroundColor: preset.accentColor }}
          />
        </div>
        {/* Mock accent dot */}
        <div
          className="absolute right-3 top-3 h-3 w-3 rounded-full"
          style={{ backgroundColor: preset.accentColor }}
        />
        {/* Mini menu lines */}
        <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1">
          <div
            className="h-1 w-12 rounded-full"
            style={{ backgroundColor: preset.textColor, opacity: 0.6 }}
          />
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: preset.mutedTextColor }}
          />
        </div>
        {active && (
          <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground shadow">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold">{preset.name}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{preset.description}</p>
      </div>
    </button>
  );
}

function ModeOption({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-primary bg-primary/5"
          : "border-border/70 bg-background hover:border-primary/40"
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </button>
  );
}

function AccessibilityPanel({ draft }: { draft: AppearanceDraft }) {
  const checks = useMemo(() => {
    const items = [
      {
        id: "text-on-bg",
        label: "Text on background",
        fg: draft.textColor,
        bg: draft.backgroundColor,
        target: 4.5,
      },
      {
        id: "muted-on-bg",
        label: "Muted text on background",
        fg: draft.mutedTextColor,
        bg: draft.backgroundColor,
        target: 4.5,
      },
      {
        id: "text-on-card",
        label: "Text on card",
        fg: draft.textColor,
        bg: draft.cardBgColor,
        target: 4.5,
      },
      {
        id: "accent-on-bg",
        label: "Accent on background",
        fg: draft.accentColor,
        bg: draft.backgroundColor,
        target: 3,
      },
    ];
    return items.map((item) => {
      const ratio = contrastRatio(item.fg, item.bg);
      const grade = gradeContrast(ratio);
      return { ...item, ratio, grade, fails: ratio < item.target };
    });
  }, [draft]);

  const anyFails = checks.some((c) => c.fails);

  return (
    <SectionCard
      icon={<Eye className="h-5 w-5" />}
      title="Accessibility"
      description="WCAG contrast checks update as you edit. Aim for AA or higher on text."
      action={
        <Badge
          variant={anyFails ? "destructive" : "secondary"}
          className="uppercase tracking-widest"
        >
          {anyFails ? "Needs work" : "Looks good"}
        </Badge>
      }
    >
      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60">
                <div className="h-full w-full" style={{ backgroundColor: check.bg }}>
                  <div
                    className="flex h-full w-full items-center justify-center text-xs font-bold"
                    style={{ color: check.fg }}
                  >
                    Aa
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">
                  {check.ratio.toFixed(2)}:1 — target {check.target.toFixed(1)}:1
                </p>
              </div>
            </div>
            <ContrastBadge grade={check.grade} fails={check.fails} />
          </li>
        ))}
      </ul>
      {anyFails && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          One or more combos may be hard to read. Try a higher-contrast text color or
          a darker background — or apply a curated preset.
        </p>
      )}
    </SectionCard>
  );
}

function ContrastBadge({ grade, fails }: { grade: WcagGrade; fails: boolean }) {
  const styles = fails
    ? "bg-rose-500/15 text-rose-700"
    : grade === "AAA"
      ? "bg-emerald-500/15 text-emerald-700"
      : grade === "AA"
        ? "bg-emerald-500/10 text-emerald-700"
        : "bg-amber-500/15 text-amber-700";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${styles}`}
    >
      {grade}
    </span>
  );
}

function BrandColorAuto({
  brandHex,
  onApply,
  onPickBrandColor,
  logoUrl,
}: {
  brandHex: string;
  onApply: (palette: DerivedPalette) => void;
  onPickBrandColor: (hex: string) => void;
  logoUrl: string | null;
}) {
  const [input, setInput] = useState(brandHex);
  const [logoColors, setLogoColors] = useState<string[]>([]);
  const [logoLoading, setLogoLoading] = useState(false);

  useEffect(() => {
    setInput(brandHex);
  }, [brandHex]);

  // Extract logo colors whenever the logo URL changes.
  useEffect(() => {
    if (!logoUrl) {
      setLogoColors([]);
      return;
    }
    let cancelled = false;
    setLogoLoading(true);
    void extractLogoColors(logoUrl)
      .then((colors) => {
        if (!cancelled) setLogoColors(colors);
      })
      .finally(() => {
        if (!cancelled) setLogoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  const safeHex = isValidHex(input) ? normalizeHex(input) : null;
  const variants = useMemo(
    () => (safeHex ? deriveAllVariants(safeHex) : []),
    [safeHex]
  );

  const handlePickLogoColor = (hex: string) => {
    setInput(hex);
    onPickBrandColor(hex);
  };

  return (
    <SectionCard
      icon={<Wand2 className="h-5 w-5" />}
      title="Auto-Palette from Brand Color"
      description="Pick one color from your logo or brand kit. We generate three variations with WCAG-aware contrast."
      action={
        <Badge variant="outline" className="uppercase tracking-widest">
          Smart
        </Badge>
      }
    >
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-2">
        <input
          type="color"
          value={safeHex ?? brandHex}
          onChange={(event) => setInput(event.target.value)}
          className="h-10 w-10 cursor-pointer rounded-md border-none bg-transparent"
          aria-label="Brand color"
        />
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          className="flex-1 bg-transparent font-mono text-sm uppercase tracking-widest text-foreground outline-none"
          placeholder="#d4af37"
        />
        {!isValidHex(input) && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
            Invalid
          </span>
        )}
      </div>

      {logoUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            From your logo
          </span>
          {logoLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : logoColors.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {logoColors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handlePickLogoColor(hex)}
                  className="group relative h-6 w-6 rounded-full border border-border/70 transition hover:scale-110"
                  style={{ backgroundColor: hex }}
                  title={hex.toUpperCase()}
                >
                  <span className="sr-only">Use {hex}</span>
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Couldn&apos;t read logo colors (CORS or single-tone image).
            </span>
          )}
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {variants.map((variant) => (
            <DerivedVariantCard
              key={variant.variant}
              palette={variant}
              onApply={() => onApply(variant)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function DerivedVariantCard({
  palette,
  onApply,
}: {
  palette: DerivedPalette;
  onApply: () => void;
}) {
  const label = palette.variant.charAt(0).toUpperCase() + palette.variant.slice(1);
  const { grade } = palette.contrast;
  const gradeStyles =
    grade === "AAA"
      ? "bg-emerald-500/15 text-emerald-700"
      : grade === "AA"
        ? "bg-emerald-500/10 text-emerald-700"
        : grade === "AA Large"
          ? "bg-amber-500/15 text-amber-700"
          : "bg-rose-500/15 text-rose-700";

  return (
    <button
      type="button"
      onClick={onApply}
      className="group overflow-hidden rounded-xl border border-border/70 bg-background text-left transition hover:border-primary/40"
    >
      {/* Mini menu mock using the derived palette */}
      <div
        className="relative h-20 w-full overflow-hidden"
        style={{ backgroundColor: palette.backgroundColor }}
      >
        <div
          className="absolute left-2 top-2 h-[60px] w-[60%] rounded-md p-1.5 shadow-sm"
          style={{ backgroundColor: palette.cardBgColor }}
        >
          <div
            className="mb-1 h-1.5 w-3/4 rounded-full"
            style={{ backgroundColor: palette.textColor }}
          />
          <div
            className="mb-1 h-1 w-1/2 rounded-full"
            style={{ backgroundColor: palette.mutedTextColor }}
          />
          <div
            className="mt-1.5 h-1.5 w-8 rounded-full"
            style={{ backgroundColor: palette.accentColor }}
          />
        </div>
        <div
          className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: palette.accentColor }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${gradeStyles}`}
          title={`Text contrast ${palette.contrast.text.toFixed(1)}:1`}
        >
          {grade}
        </span>
      </div>
    </button>
  );
}

function FontPairCard({
  pair,
  active,
  onApply,
}: {
  pair: FontPair;
  active: boolean;
  onApply: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onApply}
      className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border/70 bg-background hover:border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="truncate text-2xl leading-none"
            style={{ fontFamily: pair.displayCss }}
          >
            Aa
          </p>
          <p
            className="mt-2 truncate text-xs text-muted-foreground"
            style={{ fontFamily: pair.bodyCss }}
          >
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
        {active && (
          <span className="rounded-full bg-primary p-1 text-primary-foreground shadow">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="mt-3 border-t border-border/60 pt-3">
        <p className="text-sm font-semibold">{pair.name}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {pair.displayPreviewName} · {pair.bodyPreviewName}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/80">
          {pair.description}
        </p>
      </div>
    </button>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background p-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-8 cursor-pointer rounded-md border-none bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 bg-transparent font-mono text-xs uppercase tracking-widest text-foreground outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// --- Preview ---

function PreviewPanel({
  restaurant,
  categoriesWithItems,
  promotions,
  loading,
}: {
  restaurant: Restaurant;
  categoriesWithItems: CategoryWithItems[];
  promotions: Promotion[];
  loading: boolean;
}) {
  return (
    <div className="xl:sticky xl:top-6 xl:self-start">
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-primary" />
            Live Preview
          </CardTitle>
          <CardDescription>
            Updates as you edit. The floating action buttons are hidden in preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto flex w-full justify-center">
            <PhoneFrame>
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading preview…
                </div>
              ) : (
                <RestaurantMenuClient
                  restaurant={restaurant}
                  categoriesWithItems={categoriesWithItems}
                  promotions={promotions}
                  previewMode
                />
              )}
            </PhoneFrame>
          </div>
        </CardContent>
      </Card>

      <p className="mt-3 px-1 text-center text-xs text-muted-foreground">
        <ArrowLeft className="mr-1 inline h-3 w-3" />
        Save before opening the live menu in a new tab.
      </p>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`relative ${ALL_FONTS_CLASS}`}>
      <div
        className="overflow-hidden rounded-[2.25rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl"
        style={{ width: 360, height: 720 }}
      >
        <div className="h-full w-full overflow-y-auto bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
