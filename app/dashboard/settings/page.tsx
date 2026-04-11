"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Palette, Settings, Share2, SlidersHorizontal } from "lucide-react";
import { DashboardShell } from "@/src/components/dashboard/DashboardShell";
import { RestaurantSettingsModal } from "@/src/components/menu-builder/RestaurantSettingsModal";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Toast, ToastType } from "@/src/components/ui/Toast";
import { uploadAsset } from "@/src/utils/uploads";
import { Restaurant, RestaurantSettings as RestaurantSettingsType, UserRole } from "@/src/types";

function SettingsContent({
  fetchRestaurants,
  selectedRestaurant,
  userRole,
}: {
  fetchRestaurants: () => Promise<void>;
  selectedRestaurant: Restaurant;
  userRole: UserRole;
}) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const initialSettings = useMemo(
    () => ({
      name: selectedRestaurant.name || "",
      estYear: selectedRestaurant.est_year || "",
      subtitle: selectedRestaurant.subtitle || "",
      slogan: selectedRestaurant.slogan || "",
      logoUrl: selectedRestaurant.logo_url || "",
      appearance: selectedRestaurant.appearance || "minimal",
      backgroundColor: selectedRestaurant.background_color || "#ffffff",
      accentColor: selectedRestaurant.accent_color || "#6366f1",
      cardBgColor: selectedRestaurant.card_bg_color || "#ffffff",
      backgroundImageUrl: selectedRestaurant.background_image_url || "",
      textColor: selectedRestaurant.text_color || "#000000",
      mutedTextColor: selectedRestaurant.muted_text_color || "#6b7280",
      footerQuote: selectedRestaurant.footer_quote || "",
      openHours: selectedRestaurant.open_hours || "",
      openBottomSheetOnClick: selectedRestaurant.open_bottom_sheet_on_click ?? true,
      recommendationAiEnabled: selectedRestaurant.recommendation_ai_enabled ?? true,
      menuFiltersEnabled: selectedRestaurant.menu_filters_enabled ?? true,
      feedbackEnabled: selectedRestaurant.feedback_enabled ?? true,
      facebookUrl: selectedRestaurant.facebook_url || "",
      instagramUrl: selectedRestaurant.instagram_url || "",
      tiktokUrl: selectedRestaurant.tiktok_url || "",
      phone: selectedRestaurant.phone || "",
    }),
    [selectedRestaurant]
  );

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const handleSaveSettings = async (
    settings: RestaurantSettingsType,
    newLogoFile?: File,
    newBackgroundFile?: File
  ) => {
    try {
      let logoUrl = settings.logoUrl;
      let backgroundImageUrl = settings.backgroundImageUrl;

      if (newLogoFile) {
        logoUrl = await uploadAsset(newLogoFile, `restaurant-assets/${selectedRestaurant.id}`);
      }

      if (newBackgroundFile) {
        backgroundImageUrl = await uploadAsset(
          newBackgroundFile,
          `restaurant-assets/${selectedRestaurant.id}`
        );
      }

      const response = await fetch(`/api/restaurants/${selectedRestaurant.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          est_year: settings.estYear,
          subtitle: settings.subtitle,
          slogan: settings.slogan,
          logo_url: logoUrl,
          appearance: settings.appearance,
          background_color: settings.backgroundColor,
          accent_color: settings.accentColor,
          card_bg_color: settings.cardBgColor,
          text_color: settings.textColor,
          muted_text_color: settings.mutedTextColor,
          background_image_url: backgroundImageUrl,
          footer_quote: settings.footerQuote,
          open_hours: settings.openHours,
          open_bottom_sheet_on_click: settings.openBottomSheetOnClick,
          recommendation_ai_enabled: settings.recommendationAiEnabled,
          menu_filters_enabled: settings.menuFiltersEnabled,
          feedback_enabled: settings.feedbackEnabled,
          facebook_url: settings.facebookUrl ?? "",
          instagram_url: settings.instagramUrl ?? "",
          tiktok_url: settings.tiktokUrl ?? "",
          phone: settings.phone ?? "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update restaurant settings");
      }

      await fetchRestaurants();
      setIsSettingsModalOpen(false);
      showToast("Settings updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save settings", "error");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <Badge variant="secondary" className="uppercase tracking-widest">
                Settings
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {selectedRestaurant.name}
              </h1>
              <CardDescription className="mt-2 max-w-2xl">
                Manage how this restaurant looks, behaves, and appears to guests.
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Edit Settings
            </Button>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SettingsCard
            icon={<Palette className="h-5 w-5 text-indigo-600" />}
            title="Appearance"
            rows={[
              ["Mode", selectedRestaurant.appearance || "minimal"],
              ["Accent", selectedRestaurant.accent_color || "#6366f1"],
              ["Background", selectedRestaurant.background_color || "#ffffff"],
            ]}
          />
          <SettingsCard
            icon={<SlidersHorizontal className="h-5 w-5 text-indigo-600" />}
            title="Feature Toggles"
            rows={[
              [
                "AI recommendations",
                selectedRestaurant.recommendation_ai_enabled === false ? "Off" : "On",
              ],
              [
                "Menu filters",
                selectedRestaurant.menu_filters_enabled === false ? "Off" : "On",
              ],
              [
                "Quick feedback",
                selectedRestaurant.feedback_enabled === false ? "Off" : "On",
              ],
            ]}
          />
          <SettingsCard
            icon={<Share2 className="h-5 w-5 text-indigo-600" />}
            title="Contact & Socials"
            rows={[
              ["Phone", selectedRestaurant.phone || "Not set"],
              ["Instagram", selectedRestaurant.instagram_url || "Not set"],
              ["Facebook", selectedRestaurant.facebook_url || "Not set"],
            ]}
          />
        </div>
      </div>

      <RestaurantSettingsModal
        key={selectedRestaurant.id}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userRole={userRole}
        initialSettings={initialSettings}
        onSave={handleSaveSettings}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <DashboardShell section="settings">
      {({ fetchRestaurants, selectedRestaurant, userRole }) => (
        <SettingsContent
          fetchRestaurants={fetchRestaurants}
          selectedRestaurant={selectedRestaurant!}
          userRole={userRole}
        />
      )}
    </DashboardShell>
  );
}

function SettingsCard({
  icon,
  title,
  rows,
}: {
  icon: ReactNode;
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3">{icon}</div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
          >
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="max-w-[58%] text-right text-sm font-medium">
              {value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
