"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  FileText,
  Clock,
  Share2,
  Palette,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  UploadCloud,
  AlertCircle,
} from "lucide-react";
import { generateSlug } from "@/src/utils/slug";
import { createClient } from "@/src/utils/supabase/client";

const STEPS = [
  { id: 1, title: "Basics", subtitle: "Name and URL", icon: Store },
  { id: 2, title: "About", subtitle: "Description & story", icon: FileText },
  { id: 3, title: "Contact", subtitle: "Hours & phone", icon: Clock },
  { id: 4, title: "Social", subtitle: "Optional links", icon: Share2 },
  { id: 5, title: "Branding", subtitle: "Look & feel", icon: Palette },
  { id: 6, title: "Review", subtitle: "Confirm & create", icon: CheckCircle2 },
];

// Predefined themes from README (onboarding only)
const PRESET_THEMES = {
  amber: {
    name: "Amber",
    background_color: "#161412",
    accent_color: "#E19638",
    card_bg_color: "#211E1B",
  },
  emerald: {
    name: "Emerald",
    background_color: "#0D1111",
    accent_color: "#2DBF8D",
    card_bg_color: "#171C1C",
  },
  rose: {
    name: "Rose",
    background_color: "#141019",
    accent_color: "#F04D95",
    card_bg_color: "#131A21",
  },
  midnight: {
    name: "Midnight",
    background_color: "#0B0E13",
    accent_color: "#42B0F0",
    card_bg_color: "#131A21",
  },
  crimson: {
    name: "Crimson",
    background_color: "#100F0F",
    accent_color: "#E11B1B",
    card_bg_color: "#1B1919",
  },
} as const;

type ThemeId = keyof typeof PRESET_THEMES;

const DEFAULT_COLORS = {
  accent_color: "#E19638",
  card_bg_color: "#211E1B",
  background_color: "#161412",
  text_color: "#ededed",
  muted_text_color: "#a1a1aa",
};

type FormData = {
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  est_year: string;
  slogan: string;
  open_hours: string;
  footer_quote: string;
  phone: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  appearance: "minimal" | "visual";
  theme: ThemeId;
  accent_color: string;
  card_bg_color: string;
  background_color: string;
  text_color: string;
  muted_text_color: string;
  open_bottom_sheet_on_click: boolean;
};

const initialFormData: FormData = {
  name: "",
  slug: "",
  subtitle: "",
  description: "",
  est_year: "",
  slogan: "",
  open_hours: "",
  footer_quote: "",
  phone: "",
  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
  appearance: "minimal",
  theme: "amber",
  ...DEFAULT_COLORS,
  open_bottom_sheet_on_click: true,
};

const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";
const inputClass =
  "w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData.name.trim()) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [formData.name]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // Sync colors when user picks a different theme (onboarding uses predefined themes only)
  const prevThemeRef = useRef<ThemeId>(formData.theme);
  useEffect(() => {
    if (prevThemeRef.current === formData.theme) return;
    prevThemeRef.current = formData.theme;
    const t = PRESET_THEMES[formData.theme];
    setFormData((prev) => ({
      ...prev,
      background_color: t.background_color,
      accent_color: t.accent_color,
      card_bg_color: t.card_bg_color,
    }));
  }, [formData.theme]);

  const update = (updates: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...updates }));

  const canNext = () => {
    if (step === 1) return formData.name.trim() && formData.slug.trim();
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        description: formData.description.trim() || undefined,
        est_year: formData.est_year.trim() || undefined,
        slogan: formData.slogan.trim() || undefined,
        open_hours: formData.open_hours.trim() || undefined,
        footer_quote: formData.footer_quote.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        facebook_url: formData.facebook_url.trim() || undefined,
        instagram_url: formData.instagram_url.trim() || undefined,
        tiktok_url: formData.tiktok_url.trim() || undefined,
        appearance: formData.appearance,
        accent_color: formData.accent_color,
        card_bg_color: formData.card_bg_color,
        background_color: formData.background_color,
        text_color: formData.text_color,
        muted_text_color: formData.muted_text_color,
        open_bottom_sheet_on_click: formData.open_bottom_sheet_on_click,
      };

      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create restaurant");

      const restaurantId = data.id as string;

      if (logoFile && restaurantId) {
        const supabase = createClient();
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${restaurantId}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("restaurant-assets")
          .upload(filePath, logoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("restaurant-assets").getPublicUrl(filePath);
          await supabase.from("restaurants").update({ logo_url: urlData.publicUrl }).eq("id", restaurantId);
        }
      }

      router.push("/dashboard/menu-builder");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = STEPS.length;
  const currentStepInfo = STEPS[step - 1];
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Top: step names + progress */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-4">
          <nav className="flex flex-wrap gap-2 justify-center mb-4" aria-label="Onboarding steps">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  step === s.id
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                aria-label={`Go to step: ${s.title}`}
                aria-current={step === s.id ? "step" : undefined}
              >
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                {s.title}
              </button>
            ))}
          </nav>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content: single column, consistent padding */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-6 pb-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">{currentStepInfo.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{currentStepInfo.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="p-5 sm:p-6">
            {error && (
              <div className="flex items-center gap-3 p-4 mb-5 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}

            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Restaurant name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="e.g. La Trattoria"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Menu URL *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => update({ slug: e.target.value })}
                    placeholder="la-trattoria"
                    className={`${inputClass} font-mono text-sm`}
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Guests will open your menu at /{formData.slug || "your-slug"}</p>
                </div>
                <div>
                  <label className={labelClass}>Subtitle <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => update({ subtitle: e.target.value })}
                    placeholder="e.g. Italian Cuisine"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Step 2: About */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Short description <span className="text-slate-400 font-normal">(optional)</span></label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="A few lines about your restaurant..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Est. year <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.est_year}
                    onChange={(e) => update({ est_year: e.target.value })}
                    placeholder="e.g. 1998"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Slogan <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => update({ slogan: e.target.value })}
                    placeholder="e.g. Best pizza in town"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Open hours <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.open_hours}
                    onChange={(e) => update({ open_hours: e.target.value })}
                    placeholder="e.g. Tue–Sun 5pm – 2am"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                    placeholder="+389 70 123 456"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Footer quote <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.footer_quote}
                    onChange={(e) => update({ footer_quote: e.target.value })}
                    placeholder="e.g. Thank you for dining with us"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Social */}
            {step === 4 && (
              <div className="space-y-5">
                <p className="text-sm text-slate-500 mb-1">Add links so guests can follow you. All optional.</p>
                <div>
                  <label className={labelClass}>Facebook</label>
                  <input
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) => update({ facebook_url: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => update({ instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>TikTok</label>
                  <input
                    type="url"
                    value={formData.tiktok_url}
                    onChange={(e) => update({ tiktok_url: e.target.value })}
                    placeholder="https://tiktok.com/@..."
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Branding */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Logo <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  />
                  {logoPreview ? (
                    <div className="flex items-center gap-4 flex-wrap">
                      <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoFile(null)}
                          className="px-3 py-2 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                    >
                      <UploadCloud className="w-8 h-8" />
                      <span className="text-sm font-medium">Upload logo</span>
                    </button>
                  )}
                </div>
                <div>
                  <label className={`${labelClass} mb-2`}>Theme</label>
                  <p className="text-xs text-slate-500 mb-3">Choose a predefined theme for your menu. You can change it later in Settings.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(PRESET_THEMES) as ThemeId[]).map((themeId) => {
                      const t = PRESET_THEMES[themeId];
                      const isSelected = formData.theme === themeId;
                      return (
                        <button
                          key={themeId}
                          type="button"
                          onClick={() => update({ theme: themeId })}
                          className={`rounded-xl border-2 overflow-hidden transition-all text-left ${
                            isSelected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex gap-1.5 p-2" style={{ backgroundColor: t.background_color }}>
                            <span
                              className="w-5 h-5 rounded-full shrink-0 border-2 border-white/30"
                              style={{ backgroundColor: t.accent_color }}
                            />
                            <span
                              className="flex-1 h-5 rounded border border-white/20"
                              style={{ backgroundColor: t.card_bg_color }}
                            />
                          </div>
                          <span className="block px-2.5 py-2 bg-white font-medium text-slate-800 text-sm">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">Product detail on tap</p>
                    <p className="text-xs text-slate-500 mt-0.5">Open bottom sheet when guests tap a product card</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.open_bottom_sheet_on_click}
                    onClick={() => update({ open_bottom_sheet_on_click: !formData.open_bottom_sheet_on_click })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      formData.open_bottom_sheet_on_click ? "bg-indigo-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        formData.open_bottom_sheet_on_click ? "translate-x-5" : "translate-x-0.5"
                      }`}
                      style={{ marginTop: 2 }}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Everything looks good? You can go back to edit any step, or create your restaurant.</p>
                <dl className="divide-y divide-slate-100">
                  {[
                    { label: "Name", value: formData.name || "—" },
                    { label: "URL", value: `/${formData.slug || "—"}` },
                    { label: "Subtitle", value: formData.subtitle || "—" },
                    { label: "Description", value: formData.description ? `${formData.description.slice(0, 60)}${formData.description.length > 60 ? "…" : ""}` : "—" },
                    { label: "Open hours", value: formData.open_hours || "—" },
                    { label: "Phone", value: formData.phone || "—" },
                    { label: "Theme", value: PRESET_THEMES[formData.theme].name },
                    { label: "Logo", value: logoFile ? logoFile.name : "None" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4 py-3 first:pt-0">
                      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
                      <dd className="text-sm font-medium text-slate-900 text-right truncate">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer: fixed-like bar with safe padding */}
      <footer className="sticky bottom-0 z-10 bg-white/90 backdrop-blur-md border-t border-slate-200/80">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !formData.name.trim() || !formData.slug.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create restaurant
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
