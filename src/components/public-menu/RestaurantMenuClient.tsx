"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MenuHero from "@/src/components/public-menu/MenuHero";
import MenuSection from "@/src/components/public-menu/MenuSection";
import { CircleEllipsis, Facebook, Instagram, Phone, X } from "lucide-react";
import { MenuItem, MenuCategory, Restaurant } from "@/src/types";

// TikTok icon (Lucide does not ship one) – minimal “note” shape
function TiktokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

interface RestaurantMenuClientProps {
  categoriesWithItems: CategoryWithItems[];
  restaurant: Restaurant;
}

export default function RestaurantMenuClient({
  categoriesWithItems,
  restaurant,
}: RestaurantMenuClientProps) {
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  const transformItems = (items: MenuItem[]) =>
    items.map((item) => ({
      name: item.name,
      description: item.description || "",
      price: `${item.price.toFixed(0)} ден.`,
      image: item.image_url,
      is_available: item.is_available,
    }));

  const isVisualMode = restaurant.appearance === "visual";

  const socialLinks = [
    ...(restaurant.facebook_url?.trim()
      ? [
          {
            icon: Facebook,
            url: restaurant.facebook_url.trim(),
            label: "FB" as const,
          },
        ]
      : []),
    ...(restaurant.instagram_url?.trim()
      ? [
          {
            icon: Instagram,
            url: restaurant.instagram_url.trim(),
            label: "IG" as const,
          },
        ]
      : []),
    ...(restaurant.tiktok_url?.trim()
      ? [
          {
            icon: TiktokIcon,
            url: restaurant.tiktok_url.trim(),
            label: "TikTok" as const,
          },
        ]
      : []),
    ...(restaurant.phone?.trim()
      ? [
          {
            icon: Phone,
            url: `tel:${restaurant.phone.trim()}`,
            label: "Call" as const,
          },
        ]
      : []),
  ];

  return (
    <div
      className="min-h-screen text-foreground transition-colors duration-500"
      style={
        {
          "--background": restaurant.background_color || "#161412",
          "--accent": restaurant.accent_color || "#d4af37",
          "--card": restaurant.card_bg_color || "#211f1c",
          "--foreground": restaurant.text_color || "#211f1c",
          "--muted-foreground": restaurant.muted_text_color || "#211f1c",
          backgroundColor: "var(--background)",
          ...(isVisualMode
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${restaurant.background_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
              }
            : {}),
        } as React.CSSProperties
      }
    >
      {/* Full-screen Blur Backdrop */}
      <AnimatePresence>
        {isSocialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSocialOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Floating Menu Container */}
      <div className="fixed bottom-6 left-5 z-50 flex flex-col items-start gap-4">
        {/* The Social Box (Opens upwards) */}
        <AnimatePresence>
          {isSocialOpen && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
                y: 20,
                originX: 0,
                originY: 1,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-[var(--card)] border border-accent/20 p-4 rounded-2xl shadow-2xl w-64 mb-2"
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <p className="text-[10px] uppercase tracking-widest text-accent font-bold">
                  Connect
                </p>
                <button onClick={() => setIsSocialOpen(false)}>
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {socialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url}
                    {...(social.url.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                      <social.icon size={18} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {social.label}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Main Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSocialOpen(!isSocialOpen)}
          className="w-12 h-12 rounded-full bg-accent border-2 border-black flex items-center justify-center shadow-lg transition-transform"
        >
          <motion.div
            animate={{ rotate: isSocialOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isSocialOpen ? (
              <X className="text-black" />
            ) : (
              <CircleEllipsis className="text-black" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="relative container max-w-4xl mx-auto px-6 py-8">
        <MenuHero
          title={restaurant.name}
          subtitle={restaurant.subtitle}
          slogan={restaurant.slogan}
          estYear={restaurant.est_year}
          logoImage={restaurant.logo_url}
        />

        {categoriesWithItems.length > 0 ? (
          <div className="mt-8">
            {categoriesWithItems.map((category, index) => (
              <MenuSection
                key={category.id}
                title={category.name}
                items={transformItems(category.items)}
                delay={0.03 + index * 0.1}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-8">
            No menu items available.
          </p>
        )}

        <footer className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm mb-2">
            {restaurant.open_hours}
          </p>
          <p className="text-muted-foreground/60 text-xs">
            {restaurant.footer_quote}
          </p>
        </footer>
      </div>
    </div>
  );
}
