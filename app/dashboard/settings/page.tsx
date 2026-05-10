"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/src/components/dashboard/DashboardProvider";
import { RestaurantSettingsForm } from "@/src/components/menu-builder/RestaurantSettingsForm";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
} from "@/src/components/ui/card";
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
      smartHighlightsEnabled: selectedRestaurant.smart_highlights_enabled ?? true,
      callWaiterEnabled: selectedRestaurant.call_waiter_enabled ?? false,
      categoryCardsEnabled: selectedRestaurant.category_cards_enabled ?? true,
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
          smart_highlights_enabled: settings.smartHighlightsEnabled,
          call_waiter_enabled: settings.callWaiterEnabled,
          category_cards_enabled: settings.categoryCardsEnabled,
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
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit uppercase tracking-widest">
              Settings
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              {selectedRestaurant.name}
            </h1>
            <CardDescription className="max-w-2xl">
              Manage how this restaurant looks, behaves, and appears to guests.
              Changes are saved when you click Save Changes at the bottom.
            </CardDescription>
          </CardHeader>
        </Card>

        <RestaurantSettingsForm
          key={selectedRestaurant.id}
          userRole={userRole}
          initialSettings={initialSettings}
          onSave={handleSaveSettings}
        />
      </div>

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
  const { fetchRestaurants, selectedRestaurant, userRole } = useDashboard();
  if (!selectedRestaurant) return null;
  return (
    <SettingsContent
      fetchRestaurants={fetchRestaurants}
      selectedRestaurant={selectedRestaurant}
      userRole={userRole}
    />
  );
}
