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
  Settings,
} from "lucide-react";
import {RestaurantSettings, UserRole} from "@/src/types";

// --- Types ---
type SettingsTab = "general" | "appearance" | "account";

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

interface AppearanceCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

// --- INTERNAL COMPONENT: ImageUploader ---
function ImageUploader({
                         label,
                         icon,
                         currentImageUrl,
                         onFileSelect,
                         onClear,
                         variant = "light",
                       }: {
  label: string;
  icon: React.ReactNode;
  currentImageUrl: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  variant?: "light" | "dark";
}) {
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
                className={`relative group p-2 rounded-3xl border ${borderColor} ${bgColor} flex items-center justify-center overflow-hidden h-40 transition-all`}
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
                className={`cursor-pointer group p-6 rounded-3xl border-2 border-dashed ${borderColor} ${bgColor} flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-400 h-40`}
            >
              <div
                  className={`p-2 rounded-full ${
                      variant === "light"
                          ? "bg-white text-slate-400 shadow-sm"
                          : "bg-white/10 text-white/60"
                  } group-hover:scale-110 transition-transform`}
              >
                <UploadCloud size={20} />
              </div>
              <p
                  className={`text-xs font-bold ${
                      variant === "light" ? "text-slate-700" : "text-white"
                  }`}
              >
                Upload Image
              </p>
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [settings, setSettings] = useState<RestaurantSettings>(
      initialSettings || {
        name: "Your Restaurant",
        estYear: "",
        subtitle: "",
        slogan: "",
        logoUrl: "",
        appearance: "minimal",
        accentColor: "#6366f1",
        backgroundColor: "#ffffff",
        cardBgColor: "#ffffff",
        backgroundImageUrl: "",
        textColor: "#000000",
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
      if (newLogoFile) URL.revokeObjectURL(logoPreview);
      if (newBackgroundFile) URL.revokeObjectURL(backgroundPreview);
    };
  }, [newLogoFile, newBackgroundFile, logoPreview, backgroundPreview]);

  return (
      <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Settings"
            description="Manage your brand identity and menu look."
        >
          <div className="flex flex-col h-[580px]">
            {/* 1. TABS HEADER */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-[20px] mb-6">
              <TabButton
                  active={activeTab === "general"}
                  onClick={() => setActiveTab("general")}
                  label="General"
                  icon={<Settings size={14} />}
              />
              <TabButton
                  active={activeTab === "appearance"}
                  onClick={() => setActiveTab("appearance")}
                  label="Appearance"
                  icon={<Palette size={14} />}
              />
              {userRole === "admin" && (
                  <TabButton
                      active={activeTab === "account"}
                      onClick={() => setActiveTab("account")}
                      label="Account"
                      icon={<UserCog size={14} />}
                  />
              )}
            </div>

            {/* 2. SCROLLABLE CONTENT */}
            <div
                className="flex-1 overflow-y-auto pr-2 overflow-x-hidden"
                style={{ scrollbarWidth: "thin" }}
            >
              {activeTab === "general" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
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

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block px-1">
                          Restaurant Name (Read-only)
                        </label>
                        <input
                            type="text"
                            value={settings.name}
                            readOnly
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-medium text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block px-1 text-slate-500">
                          Establishment Year
                        </label>
                        <input
                            type="text"
                            placeholder="eg. 1998"
                            value={settings.estYear}
                            onChange={(e) =>
                                setSettings({ ...settings, estYear: e.target.value })
                            }
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block px-1">
                          Subtitle
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Italian Cuisine"
                            value={settings.subtitle}
                            onChange={(e) =>
                                setSettings({ ...settings, subtitle: e.target.value })
                            }
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block px-1">
                          Slogan
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Best pizza in town"
                            value={settings.slogan}
                            onChange={(e) =>
                                setSettings({ ...settings, slogan: e.target.value })
                            }
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
              )}

              {activeTab === "appearance" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 px-1">
                        <Layout size={12} /> Appearance Mode
                      </label>
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

                    <div className="p-5 rounded-4xl bg-slate-50 border border-slate-100">
                      {settings.appearance === "minimal" ? (
                          <div className="space-y-5">
                            <ColorPicker
                                label="Background Color"
                                value={settings.backgroundColor}
                                onChange={(v) =>
                                    setSettings({ ...settings, backgroundColor: v })
                                }
                            />
                            <ColorPicker
                                label="Accent Color"
                                value={settings.accentColor}
                                onChange={(v) =>
                                    setSettings({ ...settings, accentColor: v })
                                }
                            />
                            <ColorPicker
                                label="Card Background Color"
                                value={settings.cardBgColor}
                                onChange={(v) =>
                                    setSettings({ ...settings, cardBgColor: v })
                                }
                            />
                            <ColorPicker
                                label="Text Color"
                                value={settings.textColor}
                                onChange={(v) =>
                                    setSettings({ ...settings, textColor: v })
                                }
                            />
                          </div>
                      ) : (
                          <div className="space-y-5">
                              <ImageUploader
                                  label="Menu Background Image"
                                  icon={<ImageIcon size={12} />}
                                  currentImageUrl={backgroundPreview}
                                  onFileSelect={setNewBackgroundFile}
                                  onClear={() => {
                                      setNewBackgroundFile(null);
                                      setSettings({ ...settings, backgroundImageUrl: "" });
                                  }}
                              />
                              <ColorPicker
                                  label="Accent Color"
                                  value={settings.accentColor}
                                  onChange={(v) =>
                                      setSettings({ ...settings, accentColor: v })
                                  }
                              />
                              <ColorPicker
                                  label="Card Background Color"
                                  value={settings.cardBgColor}
                                  onChange={(v) =>
                                      setSettings({ ...settings, cardBgColor: v })
                                  }
                              />
                              <ColorPicker
                                  label="Text Color"
                                  value={settings.textColor}
                                  onChange={(v) =>
                                      setSettings({ ...settings, textColor: v })
                                  }
                              />
                          </div>
                      )}
                    </div>
                  </div>
              )}

              {activeTab === "account" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2">
                        Security
                      </p>
                      <p className="text-sm text-indigo-600/80 leading-relaxed mb-6">
                        To update your login credentials or primary email, please
                        use the secure portal below.
                      </p>
                      <button
                          onClick={() => setIsProfileModalOpen(true)}
                          className="w-full flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white hover:bg-slate-800 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <UserCog size={18} className="text-indigo-400" />
                          <span className="text-sm font-bold">Profile & Login</span>
                        </div>
                        <Check
                            size={16}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </button>
                    </div>
                  </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 mt-auto border-t border-slate-100">
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
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-[20px] font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Check size={18} /> Save Changes
              </button>
            </div>
          </div>
        </Modal>

        <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
        />
      </>
  );
}

// --- HELPERS ---
function TabButton({
                     active,
                     onClick,
                     label,
                     icon,
                   }: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
      <button
          onClick={onClick}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[16px] text-[11px] font-black uppercase tracking-wider transition-all ${
              active
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
          }`}
      >
        {icon} {label}
      </button>
  );
}

function AppearanceCard({ selected, onClick, icon, title, desc }: AppearanceCardProps) {
  return (
      <button
          onClick={onClick}
          className={`p-4 rounded-[24px] border-2 text-left transition-all ${
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
        <p className="font-bold text-slate-900 text-xs">{title}</p>
        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
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
  onChange: (v: string) => void;
}) {
  return (
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 px-1">
          {label}
        </label>
        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
          <input
              type="color"
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
          />
          <span className="font-mono text-xs font-bold text-slate-600 uppercase tracking-widest">
          {value}
        </span>
        </div>
      </div>
  );
}