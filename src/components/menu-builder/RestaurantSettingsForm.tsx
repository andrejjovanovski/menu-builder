"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Clock,
  Image as ImageIcon,
  Layout,
  Loader2,
  Palette,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  UserCog,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { RestaurantSettings, UserRole } from "@/src/types";

interface Props {
  userRole: UserRole;
  initialSettings: RestaurantSettings;
  onSave: (
    settings: RestaurantSettings,
    newLogoFile?: File,
    newBackgroundFile?: File
  ) => Promise<void> | void;
}

export function RestaurantSettingsForm({
  userRole,
  initialSettings,
  onSave,
}: Props) {
  const [settings, setSettings] = useState<RestaurantSettings>(initialSettings);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [newBackgroundFile, setNewBackgroundFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
    setNewLogoFile(null);
    setNewBackgroundFile(null);
  }, [initialSettings]);

  const logoPreview = newLogoFile
    ? URL.createObjectURL(newLogoFile)
    : settings.logoUrl;
  const backgroundPreview = newBackgroundFile
    ? URL.createObjectURL(newBackgroundFile)
    : settings.backgroundImageUrl;

  useEffect(() => {
    return () => {
      if (newLogoFile) URL.revokeObjectURL(logoPreview);
      if (newBackgroundFile) URL.revokeObjectURL(backgroundPreview);
    };
  }, [newLogoFile, newBackgroundFile, logoPreview, backgroundPreview]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(
        settings,
        newLogoFile || undefined,
        newBackgroundFile || undefined
      );
      setNewLogoFile(null);
      setNewBackgroundFile(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setNewLogoFile(null);
    setNewBackgroundFile(null);
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        <SectionCard
          icon={<Sparkles className="h-5 w-5 text-indigo-600" />}
          title="Brand Identity"
          description="The first thing guests see — logo, name, and a short pitch."
        >
          <ImageUploader
            label="Restaurant Logo"
            currentImageUrl={logoPreview}
            onFileSelect={setNewLogoFile}
            onClear={() => {
              setNewLogoFile(null);
              setSettings({ ...settings, logoUrl: "" });
            }}
          />

          <Field label="Restaurant Name" hint="Read-only">
            <input
              type="text"
              value={settings.name}
              readOnly
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-medium text-sm outline-none"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Establishment Year">
              <TextInput
                placeholder="eg. 1998"
                value={settings.estYear}
                onChange={(value) => setSettings({ ...settings, estYear: value })}
              />
            </Field>
            <Field label="Subtitle">
              <TextInput
                placeholder="e.g. Italian Cuisine"
                value={settings.subtitle}
                onChange={(value) =>
                  setSettings({ ...settings, subtitle: value })
                }
              />
            </Field>
          </div>

          <Field label="Slogan">
            <TextInput
              placeholder="e.g. Best pizza in town"
              value={settings.slogan}
              onChange={(value) => setSettings({ ...settings, slogan: value })}
            />
          </Field>
        </SectionCard>

        <SectionCard
          icon={<Palette className="h-5 w-5 text-indigo-600" />}
          title="Appearance"
          description="Choose a look for the public menu and tune the colors."
        >
          <div className="space-y-3">
            <SectionLabel icon={<Layout size={12} />}>Mode</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <AppearanceCard
                selected={settings.appearance === "minimal"}
                onClick={() =>
                  setSettings({ ...settings, appearance: "minimal" })
                }
                icon={<Palette size={18} />}
                title="Minimalist"
                desc="Clean & Solid"
              />
              <AppearanceCard
                selected={settings.appearance === "visual"}
                onClick={() =>
                  setSettings({ ...settings, appearance: "visual" })
                }
                icon={<ImageIcon size={18} />}
                title="Visual"
                desc="Custom background image"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 border border-slate-100 p-5 space-y-5">
            {settings.appearance === "visual" && (
              <ImageUploader
                label="Menu Background Image"
                currentImageUrl={backgroundPreview}
                onFileSelect={setNewBackgroundFile}
                onClear={() => {
                  setNewBackgroundFile(null);
                  setSettings({ ...settings, backgroundImageUrl: "" });
                }}
              />
            )}

            {settings.appearance === "minimal" && (
              <ColorPicker
                label="Background Color"
                value={settings.backgroundColor}
                onChange={(v) =>
                  setSettings({ ...settings, backgroundColor: v })
                }
              />
            )}
            <ColorPicker
              label="Accent Color"
              value={settings.accentColor}
              onChange={(v) => setSettings({ ...settings, accentColor: v })}
            />
            <ColorPicker
              label="Card Background Color"
              value={settings.cardBgColor}
              onChange={(v) => setSettings({ ...settings, cardBgColor: v })}
            />
            <ColorPicker
              label="Text Color"
              value={settings.textColor}
              onChange={(v) => setSettings({ ...settings, textColor: v })}
            />
            <ColorPicker
              label="Muted Text Color"
              value={settings.mutedTextColor}
              onChange={(v) => setSettings({ ...settings, mutedTextColor: v })}
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={<Bell className="h-5 w-5 text-indigo-600" />}
          title="Menu Features"
          description="Switch features on or off for the public-facing menu."
        >
          <ToggleRow
            label="Category cards"
            description="Show categories as image cards on the public menu. Customers tap a card to see that section's items."
            checked={settings.categoryCardsEnabled}
            onChange={(value) =>
              setSettings({ ...settings, categoryCardsEnabled: value })
            }
          />
          <ToggleRow
            label="Smart highlights"
            description='Show "Popular right now" strip and trending / best-seller badges.'
            checked={settings.smartHighlightsEnabled}
            onChange={(value) =>
              setSettings({ ...settings, smartHighlightsEnabled: value })
            }
          />
          <ToggleRow
            label="AI recommendations"
            description="Show the ask-for-a-recommendation assistant on the public menu."
            checked={settings.recommendationAiEnabled}
            onChange={(value) =>
              setSettings({ ...settings, recommendationAiEnabled: value })
            }
          />
          <ToggleRow
            label="Menu filters"
            description="Show dietary and allergen filters on the public menu."
            checked={settings.menuFiltersEnabled}
            onChange={(value) =>
              setSettings({ ...settings, menuFiltersEnabled: value })
            }
          />
          <ToggleRow
            label="Quick feedback"
            description="Show one-tap feedback after guests browse the menu."
            checked={settings.feedbackEnabled}
            onChange={(value) =>
              setSettings({ ...settings, feedbackEnabled: value })
            }
          />
          <ToggleRow
            label="Call waiter"
            description='Show a "Call Waiter" button on the public menu so guests can signal staff.'
            checked={settings.callWaiterEnabled}
            onChange={(value) =>
              setSettings({ ...settings, callWaiterEnabled: value })
            }
          />
          <ToggleRow
            label="Open bottom sheet on card click"
            description="When enabled, tapping a product card with an image opens a detail sheet."
            checked={settings.openBottomSheetOnClick}
            onChange={(value) =>
              setSettings({ ...settings, openBottomSheetOnClick: value })
            }
          />
        </SectionCard>

        <SectionCard
          icon={<Clock className="h-5 w-5 text-indigo-600" />}
          title="Hours & Footer"
          description="Free-form text shown on the public menu."
        >
          <Field label="Open hours">
            <TextInput
              placeholder="e.g. Open Tuesday – Sunday • 5pm – 2am"
              value={settings.openHours}
              onChange={(value) => setSettings({ ...settings, openHours: value })}
            />
          </Field>
          <Field label="Footer quote">
            <TextInput
              placeholder="e.g. Best pizza in town"
              value={settings.footerQuote}
              onChange={(value) =>
                setSettings({ ...settings, footerQuote: value })
              }
            />
          </Field>
        </SectionCard>

        <SectionCard
          icon={<Share2 className="h-5 w-5 text-indigo-600" />}
          title="Contact & Socials"
          description="Links and a phone number that appear on the public menu."
        >
          <Field label="Phone (Call)">
            <TextInput
              type="tel"
              placeholder="e.g. +389 70 123 456"
              value={settings.phone ?? ""}
              onChange={(value) => setSettings({ ...settings, phone: value })}
            />
          </Field>
          <Field label="Instagram URL">
            <TextInput
              type="url"
              placeholder="https://instagram.com/yourpage"
              value={settings.instagramUrl ?? ""}
              onChange={(value) =>
                setSettings({ ...settings, instagramUrl: value })
              }
            />
          </Field>
          <Field label="Facebook URL">
            <TextInput
              type="url"
              placeholder="https://facebook.com/yourpage"
              value={settings.facebookUrl ?? ""}
              onChange={(value) =>
                setSettings({ ...settings, facebookUrl: value })
              }
            />
          </Field>
          <Field label="TikTok URL">
            <TextInput
              type="url"
              placeholder="https://tiktok.com/@yourpage"
              value={settings.tiktokUrl ?? ""}
              onChange={(value) =>
                setSettings({ ...settings, tiktokUrl: value })
              }
            />
          </Field>
        </SectionCard>

        {userRole === "admin" && (
          <SectionCard
            icon={<UserCog className="h-5 w-5 text-indigo-600" />}
            title="Account"
            description="Update your login credentials and primary email."
          >
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">
                Security
              </p>
              <p className="mt-2 text-sm leading-relaxed text-indigo-600/80">
                Login changes happen in a secure portal so we can re-verify your
                identity before applying them.
              </p>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="mt-4 flex w-full items-center justify-between rounded-2xl bg-slate-900 p-4 text-white transition-all hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <UserCog size={18} className="text-indigo-400" />
                  <span className="text-sm font-bold">Profile & Login</span>
                </div>
                <Check size={16} className="opacity-60" />
              </button>
            </div>
          </SectionCard>
        )}
      </div>

      <div className="sticky bottom-4 z-30 flex justify-end">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-indigo-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3">{icon}</div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
      {icon} {children}
    </label>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  type?: "text" | "tel" | "url";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
          checked ? "bg-indigo-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ImageUploader({
  label,
  currentImageUrl,
  onFileSelect,
  onClear,
}: {
  label: string;
  currentImageUrl: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="space-y-3">
      <SectionLabel icon={<ImageIcon size={12} />}>{label}</SectionLabel>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {currentImageUrl ? (
        <div className="group relative flex h-40 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-2 transition-all">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt="Preview"
            className="h-full w-auto rounded-2xl object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-white p-2 text-slate-700 shadow-xl transition hover:text-indigo-600"
            >
              <UploadCloud size={18} />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-full bg-white p-2 text-slate-700 shadow-xl transition hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-all hover:border-indigo-400"
        >
          <div className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-transform group-hover:scale-110">
            <UploadCloud size={20} />
          </div>
          <p className="text-xs font-bold text-slate-700">Upload Image</p>
        </button>
      )}
    </div>
  );
}

function AppearanceCard({
  selected,
  onClick,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-indigo-600 bg-indigo-50/50"
          : "border-slate-100 hover:border-slate-200"
      }`}
    >
      <div
        className={`mb-2 ${selected ? "text-indigo-600" : "text-slate-400"}`}
      >
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-900">{title}</p>
      <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">
        {desc}
      </p>
    </button>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-8 cursor-pointer rounded-lg border-none bg-transparent"
        />
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-600">
          {value}
        </span>
      </div>
    </div>
  );
}
