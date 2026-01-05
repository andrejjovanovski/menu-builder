"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import {
  Image as ImageIcon,
  Palette,
  Check,
  UploadCloud,
  Layout,
  Trash2,
  UserCog,
} from "lucide-react";
import { UserRole } from "@/src/types";

// --- Types ---
export interface RestaurantSettings {
  logoUrl: string;
  appearance: "minimal" | "visual";
  backgroundColor: string;
  backgroundImageUrl: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  initialSettings?: RestaurantSettings;
  onSave: (
    settings: RestaurantSettings,
    newLogoFile?: File,
    newBackgroundFile?: File
  ) => Promise<void> | void;
}

// --- INTERNAL COMPONENT: ImageUploader ---
interface ImageUploaderProps {
  label: string;
  icon: React.ReactNode;
  currentImageUrl: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  variant?: "light" | "dark";
}

function ImageUploader({
  label,
  icon,
  currentImageUrl,
  onFileSelect,
  onClear,
  variant = "light",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const borderColor =
    variant === "light" ? "border-slate-200" : "border-white/20";
  const bgColor = variant === "light" ? "bg-slate-50" : "bg-white/5";

  return (
    <div className="space-y-3">
      <label
        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
          variant === "light" ? "text-slate-500" : "text-indigo-300"
        }`}
      >
        {icon} {label}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {currentImageUrl ? (
        <div
          className={`relative group p-2 rounded-3xl border ${borderColor} ${bgColor} flex items-center justify-center overflow-hidden h-44 transition-all`}
        >
          <img
            src={currentImageUrl}
            alt="Preview"
            className="h-full w-auto object-contain rounded-2xl"
          />
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-xl transition"
            >
              <UploadCloud size={18} />
            </button>
            <button
              onClick={onClear}
              className="p-2 bg-white rounded-full text-slate-700 hover:text-red-600 shadow-xl transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer group p-8 rounded-3xl border-2 border-dashed ${borderColor} ${bgColor} flex flex-col items-center justify-center gap-3 transition-all hover:border-indigo-400 h-44`}
        >
          <div
            className={`p-3 rounded-full ${
              variant === "light"
                ? "bg-white text-slate-400 shadow-sm"
                : "bg-white/10 text-white/60"
            } group-hover:scale-110 transition-transform`}
          >
            <UploadCloud size={24} />
          </div>
          <div className="text-center">
            <p
              className={`text-sm font-bold ${
                variant === "light" ? "text-slate-700" : "text-white"
              }`}
            >
              Click to upload
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
              SVG, PNG, JPG (MAX. 2MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN MODAL COMPONENT ---
export function RestaurantSettingsModal({
  isOpen,
  onClose,
  userRole,
  initialSettings,
  onSave,
}: Props) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [settings, setSettings] = useState<RestaurantSettings>(
    initialSettings || {
      logoUrl: "",
      appearance: "minimal",
      backgroundColor: "#ffffff",
      backgroundImageUrl: "",
    }
  );

  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [newBackgroundFile, setNewBackgroundFile] = useState<File | null>(null);

  const logoPreview = newLogoFile
    ? URL.createObjectURL(newLogoFile)
    : settings.logoUrl;
  const backgroundPreview = newBackgroundFile
    ? URL.createObjectURL(newBackgroundFile)
    : settings.backgroundImageUrl;

  useEffect(() => {
    return () => {
      if (newLogoFile) URL.revokeObjectURL(URL.createObjectURL(newLogoFile));
      if (newBackgroundFile)
        URL.revokeObjectURL(URL.createObjectURL(newBackgroundFile));
    };
  }, [newLogoFile, newBackgroundFile]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Menu Appearance"
        description="Configure your public menu branding and styles."
      >
        <div className="space-y-8">
          {/* 1. ADMIN ACTION: PROFILE SETTINGS */}
          {userRole == "admin" && (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-900 rounded-[32px] text-white hover:bg-slate-800 transition-all group border border-slate-800"
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-500 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform">
                  <UserCog size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Profile & Login</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    Manage email and password
                  </p>
                </div>
              </div>
              <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Check size={16} className="text-indigo-400" />
              </div>
            </button>
          )}

          {/* 2. LOGO UPLOAD */}
          <ImageUploader
            label="Restaurant Logo"
            icon={<ImageIcon size={12} />}
            currentImageUrl={logoPreview}
            onFileSelect={setNewLogoFile}
            onClear={() => {
              setNewLogoFile(null);
              setSettings({ ...settings, logoUrl: "" });
            }}
          />

          {/* 3. LAYOUT SELECTOR */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Layout size={12} /> Appearance Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  setSettings({ ...settings, appearance: "minimal" })
                }
                className={`p-5 rounded-[32px] border-2 text-left transition-all ${
                  settings.appearance === "minimal"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-inner"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <Palette
                  className={`mb-3 ${
                    settings.appearance === "minimal"
                      ? "text-indigo-600"
                      : "text-slate-400"
                  }`}
                />
                <p className="font-bold text-slate-900 text-sm">Minimalist</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tight font-medium">
                  Clean solid colors
                </p>
              </button>

              <button
                onClick={() =>
                  setSettings({ ...settings, appearance: "visual" })
                }
                className={`p-5 rounded-[32px] border-2 text-left transition-all ${
                  settings.appearance === "visual"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-inner"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <ImageIcon
                  className={`mb-3 ${
                    settings.appearance === "visual"
                      ? "text-indigo-600"
                      : "text-slate-400"
                  }`}
                />
                <p className="font-bold text-slate-900 text-sm">Visual</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tight font-medium">
                  Full image backgrounds
                </p>
              </button>
            </div>
          </div>

          {/* 4. DYNAMIC BACKGROUND SECTION */}
          <div
            className={`p-6 rounded-[32px] transition-all ${
              settings.appearance === "minimal"
                ? "bg-slate-50 border border-slate-100"
                : "bg-slate-900"
            }`}
          >
            {settings.appearance === "minimal" ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                  <Palette size={12} /> Accent Color
                </label>
                <div className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-none outline-none"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        backgroundColor: e.target.value,
                      })
                    }
                  />
                  <span className="font-mono text-sm font-black text-slate-700 tracking-widest uppercase">
                    {settings.backgroundColor}
                  </span>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <ImageUploader
                  label="Menu Background Image"
                  icon={<ImageIcon size={12} />}
                  currentImageUrl={backgroundPreview}
                  onFileSelect={setNewBackgroundFile}
                  onClear={() => {
                    setNewBackgroundFile(null);
                    setSettings({ ...settings, backgroundImageUrl: "" });
                  }}
                  variant="dark"
                />
              </div>
            )}
          </div>

          {/* 5. ACTIONS */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onSave(
                  settings,
                  newLogoFile || undefined,
                  newBackgroundFile || undefined
                )
              }
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-[24px] font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Check size={18} /> Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* --- EXTERNAL PROFILE MODAL --- */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
