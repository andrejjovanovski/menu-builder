"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  UploadCloud,
  AlertCircle,
  Check,
} from "lucide-react";
import { generateSlug } from "@/src/utils/slug";
import { uploadAsset } from "@/src/utils/uploads";

const STEPS = [
  { id: 1, title: "Let's start", subtitle: "Name your restaurant" },
  { id: 2, title: "Your story", subtitle: "Tell guests about you" },
  { id: 3, title: "Find you", subtitle: "Hours & contact" },
  { id: 4, title: "Follow along", subtitle: "Social presence" },
  { id: 5, title: "Your look", subtitle: "Branding & theme" },
  { id: 6, title: "Ready to launch", subtitle: "Review & confirm" },
];

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
    card_bg_color: "#1D1527",
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

const labelClass = "block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2";
const inputClass =
  "w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50 focus:border-amber-400/40 transition-all";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
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

  const navigateTo = (nextStep: number) => {
    if (nextStep === step) return;
    setFading(true);
    setTimeout(() => {
      setStep(nextStep);
      setFading(false);
    }, 120);
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
        const logoUrl = await uploadAsset(logoFile, `restaurant-assets/${restaurantId}`);
        await fetch(`/api/restaurants/${data.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_url: logoUrl }),
        });
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
    <div className="min-h-screen bg-[#0C0B0F] text-white flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/[0.06] blur-[140px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0C0B0F]/80 backdrop-blur-xl">
        <div className="max-w-[520px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white/30 tracking-[0.2em] uppercase">MenuCup</span>
            <div className="flex items-center gap-1.5">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigateTo(s.id)}
                  aria-label={`Go to step ${s.id}`}
                  className={`transition-all duration-300 rounded-full ${
                    s.id === step
                      ? "w-5 h-1.5 bg-amber-400"
                      : s.id < step
                        ? "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
                        : "w-1.5 h-1.5 bg-white/10 hover:bg-white/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-white/25 tabular-nums">
              <span className="text-white/60 font-semibold">{String(step).padStart(2, "0")}</span>
              {" / "}
              {String(totalSteps).padStart(2, "0")}
            </span>
          </div>
          <div className="h-px bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[520px] mx-auto w-full px-6 py-10 pb-6">
        {/* Step heading */}
        <div
          className={`relative mb-8 transition-all duration-120 ${fading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}
        >
          <span className="absolute -top-6 -left-1 text-[100px] font-black text-white/[0.025] leading-none select-none pointer-events-none">
            {String(step).padStart(2, "0")}
          </span>
          <p className="relative text-[11px] font-bold text-amber-400/70 uppercase tracking-[0.18em] mb-2">
            {currentStepInfo.subtitle}
          </p>
          <h1 className="relative text-[2rem] font-bold text-white tracking-tight leading-tight">
            {currentStepInfo.title}
          </h1>
        </div>

        {/* Step content */}
        <div
          className={`transition-all duration-120 ${fading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}
        >
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-300">{error}</p>
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
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Menu URL *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm select-none">/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => update({ slug: e.target.value })}
                    placeholder="la-trattoria"
                    className={`${inputClass} pl-7 font-mono text-sm`}
                  />
                </div>
                <p className="text-xs text-white/20 mt-2">
                  Guests will open your menu at{" "}
                  <span className="text-white/40 font-mono">/{formData.slug || "your-slug"}</span>
                </p>
              </div>
              <div>
                <label className={labelClass}>
                  Subtitle{" "}
                  <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => update({ subtitle: e.target.value })}
                  placeholder="e.g. Italian Cuisine · Since 1998"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Step 2: About */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Description{" "}
                  <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="A few lines about your place, your food, your vibe..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Est. year{" "}
                    <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                  </label>
                  <input
                    type="text"
                    value={formData.est_year}
                    onChange={(e) => update({ est_year: e.target.value })}
                    placeholder="1998"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Slogan{" "}
                    <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => update({ slogan: e.target.value })}
                    placeholder="Best in town"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Opening hours{" "}
                  <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                </label>
                <input
                  type="text"
                  value={formData.open_hours}
                  onChange={(e) => update({ open_hours: e.target.value })}
                  placeholder="Tue – Sun  5 pm – 2 am"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Phone{" "}
                  <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="+389 70 123 456"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Footer quote{" "}
                  <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                </label>
                <input
                  type="text"
                  value={formData.footer_quote}
                  onChange={(e) => update({ footer_quote: e.target.value })}
                  placeholder="Thank you for dining with us"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Step 4: Social */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-white/30 -mt-2 mb-1">
                All optional — add what you have.
              </p>
              {[
                { key: "facebook_url" as const, label: "Facebook", placeholder: "https://facebook.com/yourpage" },
                { key: "instagram_url" as const, label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
                { key: "tiktok_url" as const, label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input
                    type="url"
                    value={formData[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    placeholder={placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Branding */}
          {step === 5 && (
            <div className="space-y-7">
              {/* Logo */}
              <div>
                <label className={labelClass}>
                  Logo{" "}
                  <span className="text-white/20 normal-case font-normal tracking-normal">— optional</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
                {logoPreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white/[0.08] border border-white/[0.1] text-white/70 rounded-xl text-sm font-medium hover:bg-white/[0.12] transition-colors"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoFile(null)}
                        className="px-4 py-2 text-rose-400/80 rounded-xl text-sm font-medium hover:bg-rose-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-2.5 text-white/25 hover:border-amber-400/30 hover:text-amber-400/60 hover:bg-amber-400/[0.03] transition-all"
                  >
                    <UploadCloud className="w-7 h-7" />
                    <span className="text-sm font-medium">Upload logo</span>
                  </button>
                )}
              </div>

              {/* Theme */}
              <div>
                <label className={labelClass}>Theme</label>
                <p className="text-xs text-white/25 mb-4 -mt-1">
                  Sets the colour palette for your menu. Change anytime in settings.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(PRESET_THEMES) as ThemeId[]).map((themeId) => {
                    const t = PRESET_THEMES[themeId];
                    const isSelected = formData.theme === themeId;
                    return (
                      <button
                        key={themeId}
                        type="button"
                        onClick={() => update({ theme: themeId })}
                        className={`rounded-2xl overflow-hidden border transition-all duration-200 text-left ${
                          isSelected
                            ? "border-amber-400/50 ring-2 ring-amber-400/15 scale-[1.02]"
                            : "border-white/[0.08] hover:border-white/20 hover:scale-[1.01]"
                        }`}
                      >
                        {/* Mini preview */}
                        <div className="h-[72px] p-2.5 relative" style={{ backgroundColor: t.background_color }}>
                          <div
                            className="rounded-xl p-2 h-full flex flex-col gap-1.5"
                            style={{ backgroundColor: t.card_bg_color }}
                          >
                            <div
                              className="w-4 h-4 rounded-full shrink-0"
                              style={{ backgroundColor: t.accent_color }}
                            />
                            <div
                              className="h-1 rounded-full w-3/4"
                              style={{ backgroundColor: t.accent_color, opacity: 0.35 }}
                            />
                            <div
                              className="h-1 rounded-full w-1/2"
                              style={{ backgroundColor: t.accent_color, opacity: 0.15 }}
                            />
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-black" strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-2.5 bg-white/[0.03] border-t border-white/[0.05]">
                          <span className="text-sm font-medium text-white/70">{t.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product detail toggle */}
              <div className="flex items-center justify-between gap-4 p-4 bg-white/[0.04] rounded-2xl border border-white/[0.07]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80">Product detail on tap</p>
                  <p className="text-xs text-white/30 mt-0.5">Show a detail sheet when guests tap a product</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.open_bottom_sheet_on_click}
                  onClick={() => update({ open_bottom_sheet_on_click: !formData.open_bottom_sheet_on_click })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                    formData.open_bottom_sheet_on_click ? "bg-amber-400" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-[1px] ${
                      formData.open_bottom_sheet_on_click ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-white/30 -mt-2 mb-2">
                Everything look good? You can go back to edit any step.
              </p>
              {[
                {
                  title: "Identity",
                  items: [
                    { label: "Name", value: formData.name || "—" },
                    { label: "URL", value: `/${formData.slug || "—"}` },
                    { label: "Subtitle", value: formData.subtitle || "—" },
                  ],
                },
                {
                  title: "Content",
                  items: [
                    {
                      label: "Description",
                      value: formData.description
                        ? `${formData.description.slice(0, 60)}${formData.description.length > 60 ? "…" : ""}`
                        : "—",
                    },
                    { label: "Open hours", value: formData.open_hours || "—" },
                    { label: "Phone", value: formData.phone || "—" },
                  ],
                },
                {
                  title: "Branding",
                  items: [
                    { label: "Theme", value: PRESET_THEMES[formData.theme].name },
                    { label: "Logo", value: logoFile ? logoFile.name : "None" },
                  ],
                },
              ].map((section) => (
                <div
                  key={section.title}
                  className="bg-white/[0.04] rounded-2xl border border-white/[0.07] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/[0.05]">
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                      {section.title}
                    </span>
                  </div>
                  <div className="divide-y divide-white/[0.05]">
                    {section.items.map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-4 px-4 py-3">
                        <dt className="text-sm text-white/35 shrink-0">{label}</dt>
                        <dd className="text-sm font-medium text-white/70 text-right truncate">{value}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 border-t border-white/[0.06] bg-[#0C0B0F]/80 backdrop-blur-xl">
        <div className="max-w-[520px] mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => navigateTo(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/35 hover:text-white/60 hover:bg-white/[0.05] disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => navigateTo(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 text-black rounded-xl text-sm font-semibold hover:bg-amber-300 disabled:opacity-25 disabled:pointer-events-none transition-all shadow-lg shadow-amber-400/20"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !formData.name.trim() || !formData.slug.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 text-black rounded-xl text-sm font-semibold hover:bg-amber-300 disabled:opacity-25 disabled:pointer-events-none transition-all shadow-lg shadow-amber-400/20"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {submitting ? "Creating…" : "Launch restaurant"}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}