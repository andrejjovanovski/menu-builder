"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MenuHero from "@/src/components/public-menu/MenuHero";
import MenuSection from "@/src/components/public-menu/MenuSection";
import CategoryGrid from "@/src/components/public-menu/CategoryGrid";
import { AskRecommendationSheet } from "@/src/components/public-menu/AskRecommendationSheet";
import { FeedbackPrompt } from "@/src/components/public-menu/FeedbackPrompt";
import { CallWaiterSheet } from "@/src/components/public-menu/CallWaiterSheet";
import PromotionPopup from "@/src/components/public-menu/PromotionPopup";
import ProductBottomSheet, {
  type ProductBottomSheetItem,
} from "@/src/components/public-menu/ProductBottomSheet";
import { ArrowLeft, ChevronDown, CircleEllipsis, Facebook, Filter, Instagram, Phone, X } from "lucide-react";
import { MenuItem, MenuCategory, Promotion, Restaurant } from "@/src/types";
import { trackRestaurantEvent } from "@/src/utils/analytics";
import { ALLERGEN_TAGS, DIETARY_TAGS } from "@/src/utils/menuTags";
import { getFontPair } from "@/src/utils/theme-fonts";

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
  promotions?: Promotion[];
  /**
   * Render in preview mode (used by Theme Studio): disables analytics, hides
   * the fixed-position floating widgets, and lets the menu sit inside a sized
   * container instead of taking the full viewport height.
   */
  previewMode?: boolean;
}

function toProductBottomSheetItem(item: MenuItem): ProductBottomSheetItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: `${Number(item.price).toFixed(0)} ден.`,
    image: item.image_url,
    dietary_tags: item.dietary_tags || [],
    allergen_tags: item.allergen_tags || [],
    is_available: item.is_available,
    is_best_seller: item.is_best_seller,
    is_new: item.is_new,
    is_trending: item.is_trending,
  };
}

export default function RestaurantMenuClient({
  categoriesWithItems,
  restaurant,
  promotions = [],
  previewMode = false,
}: RestaurantMenuClientProps) {
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductBottomSheetItem | null>(null);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [avoidedAllergenTags, setAvoidedAllergenTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const tableIdentifier = searchParams.get("table");

  const useCategoryCards = restaurant.category_cards_enabled !== false;
  const fontPair = getFontPair(restaurant.font_pair_id);
  const didMountCategoryNavigation = useRef(false);

  const formattedCategoryItemsById = useMemo(
    () =>
      new Map(
        categoriesWithItems.map((category) => [
          category.id,
          category.items.map(toProductBottomSheetItem),
        ])
      ),
    [categoriesWithItems]
  );

  const popularItems = useMemo(
    () =>
      categoriesWithItems
        .flatMap((category) => category.items)
        .filter((item) => item.is_available && (item.is_best_seller || item.is_trending))
        .slice(0, 6)
        .map(toProductBottomSheetItem),
    [categoriesWithItems]
  );

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

  const filteredCategories = useMemo(() => {
    return categoriesWithItems
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const itemDietaryTags = item.dietary_tags || [];
          const itemAllergenTags = item.allergen_tags || [];

          const matchesDietary = selectedDietaryTags.every((tag) =>
            itemDietaryTags.includes(tag)
          );
          const avoidsAllergens = avoidedAllergenTags.every(
            (tag) => !itemAllergenTags.includes(tag)
          );

          return matchesDietary && avoidsAllergens;
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [categoriesWithItems, selectedDietaryTags, avoidedAllergenTags]);

  const hasActiveFilters =
    selectedDietaryTags.length > 0 || avoidedAllergenTags.length > 0;
  const activeFilterCount =
    selectedDietaryTags.length + avoidedAllergenTags.length;

  useEffect(() => {
    if (previewMode) return;
    void trackRestaurantEvent({
      restaurantSlug: restaurant.slug,
      eventType: "menu_view",
    });
  }, [restaurant.slug, previewMode]);

  // Scroll the page to the top whenever the user enters or leaves a category
  // so the drilled view always starts at the header (and the grid does too on back).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (previewMode) return;
    if (!didMountCategoryNavigation.current) {
      didMountCategoryNavigation.current = true;
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedCategoryId, previewMode]);

  return (
    <div
      className={`${previewMode ? "min-h-full" : "min-h-screen"} text-foreground transition-colors duration-500`}
      style={
        {
          "--background": restaurant.background_color || "#161412",
          "--accent": restaurant.accent_color || "#d4af37",
          "--card": restaurant.card_bg_color || "#211f1c",
          "--foreground": restaurant.text_color || "#211f1c",
          "--muted-foreground": restaurant.muted_text_color || "#211f1c",
          "--menu-font-display": fontPair.displayCss,
          "--menu-font-body": fontPair.bodyCss,
          fontFamily: "var(--menu-font-body)",
          backgroundColor: "var(--background)",
          ...(isVisualMode
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${restaurant.background_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
            : {}),
        } as React.CSSProperties
      }
    >
      {/* Full-screen Blur Backdrop (socials) */}
      {!previewMode && (
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
      )}

      {!previewMode && (
        <PromotionPopup promotions={promotions} />
      )}

      <ProductBottomSheet
        key={selectedItem?.id ?? "menu-bottom-sheet"}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        restaurantSlug={restaurant.slug}
        onUpsellClick={(upsellItem) => setSelectedItem(upsellItem)}
      />
      {!previewMode && restaurant.recommendation_ai_enabled !== false && (
        <AskRecommendationSheet
          restaurantSlug={restaurant.slug}
          restaurantName={restaurant.name}
        />
      )}
      {!previewMode && restaurant.feedback_enabled !== false && (
        <FeedbackPrompt restaurantSlug={restaurant.slug} />
      )}
      {!previewMode && restaurant.call_waiter_enabled && (
        <CallWaiterSheet
          restaurantSlug={restaurant.slug}
          tableIdentifier={tableIdentifier}
        />
      )}

      {/* Floating Menu Container */}
      {!previewMode && (
      <div className="fixed bottom-6 left-5 z-40 flex flex-col items-start gap-4">
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
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform border border-accent/20"
          style={{ backgroundColor: "var(--card)" }}
        >
          <motion.div
            animate={{ rotate: isSocialOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: "var(--accent)" }}
          >
            {isSocialOpen ? (
              <X size={20} />
            ) : (
              <CircleEllipsis size={20} />
            )}
          </motion.div>
        </motion.button>
      </div>
      )}

      {/* Main Content */}
      <div className="relative container max-w-4xl mx-auto px-6 py-8">
        <MenuHero
          title={restaurant.name}
          subtitle={restaurant.subtitle}
          slogan={restaurant.slogan}
          estYear={restaurant.est_year}
          logoImage={restaurant.logo_url}
        />

        {/* Drill-in header (only shown in category cards mode when a category is selected) */}
        {useCategoryCards && selectedCategoryId && (() => {
          const cat = filteredCategories.find((c) => c.id === selectedCategoryId);
          const fallbackCat = categoriesWithItems.find((c) => c.id === selectedCategoryId);
          const displayCat = cat ?? fallbackCat;
          if (!displayCat) return null;
          return (
            <motion.div
              key="category-header"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-8"
            >
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-[var(--card)]/70 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/50"
              >
                <ArrowLeft size={14} />
                All categories
              </button>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                {displayCat.name}
              </h2>
              {displayCat.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {displayCat.description}
                </p>
              )}
            </motion.div>
          );
        })()}

        {/* Popular strip — only on grid view */}
        {!selectedCategoryId && restaurant.smart_highlights_enabled !== false && popularItems.length > 0 && (
          <section className="mt-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
              Popular right now
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {popularItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (restaurant.open_bottom_sheet_on_click !== false) {
                      void trackRestaurantEvent({
                        restaurantSlug: restaurant.slug,
                        eventType: "item_open",
                        itemId: item.id,
                      });
                      setSelectedItem(item);
                    }
                  }}
                  className="shrink-0 w-32 rounded-2xl border border-accent/20 bg-[var(--card)]/70 overflow-hidden text-left hover:border-accent/50 transition-colors"
                >
                  {item.image ? (
                    <div className="relative w-full aspect-square overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-accent/10 flex items-center justify-center text-3xl">
                      🍽️
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[var(--accent)]">
                      {item.price}
                    </p>
                    <div className="mt-1.5">
                      {item.is_trending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-300">
                          🔥 Trending
                        </span>
                      )}
                      {!item.is_trending && item.is_best_seller && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                          ⭐ Best Seller
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {restaurant.menu_filters_enabled !== false && (
        <section className="mt-8 rounded-[28px] border border-accent/15 bg-[var(--card)]/70 backdrop-blur-md overflow-hidden">
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[var(--accent)]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  Filter the menu
                </h3>
                {hasActiveFilters && (
                  <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-black">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? `${selectedDietaryTags.length} dietary and ${avoidedAllergenTags.length} allergen filter${activeFilterCount === 1 ? "" : "s"} active`
                  : "Tap to show dietary and allergen filters"}
              </p>
            </div>

            <motion.div
              animate={{ rotate: isFilterOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 text-[var(--accent)]"
            >
              <ChevronDown size={18} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {(isFilterOpen || hasActiveFilters) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-4 border-t border-white/10 px-5 pb-5 pt-4">
                  <FilterGroup
                    title="Show only"
                    options={DIETARY_TAGS}
                    selected={selectedDietaryTags}
                    onToggle={(value) =>
                      setSelectedDietaryTags((prev) =>
                        prev.includes(value)
                          ? prev.filter((tag) => tag !== value)
                          : [...prev, value]
                      )
                    }
                  />
                  <FilterGroup
                    title="Avoid allergens"
                    options={ALLERGEN_TAGS}
                    selected={avoidedAllergenTags}
                    onToggle={(value) =>
                      setAvoidedAllergenTags((prev) =>
                        prev.includes(value)
                          ? prev.filter((tag) => tag !== value)
                          : [...prev, value]
                      )
                    }
                  />

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDietaryTags([]);
                        setAvoidedAllergenTags([]);
                      }}
                      className="text-sm font-medium text-[var(--accent)] hover:opacity-80"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        )}

        {useCategoryCards ? (
          <AnimatePresence mode="wait">
            {selectedCategoryId ? (
              (() => {
                const cat = filteredCategories.find((c) => c.id === selectedCategoryId);
                if (!cat) {
                  return (
                    <motion.p
                      key="empty-drilled"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-8 text-center text-muted-foreground"
                    >
                      {hasActiveFilters
                        ? "No items in this category match your filters."
                        : "No items in this category yet."}
                    </motion.p>
                  );
                }
                return (
                  <motion.div
                    key={`drilled-${cat.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="mt-6"
                  >
                    <MenuSection
                      title={cat.name}
                      items={formattedCategoryItemsById.get(cat.id) ?? []}
                      delay={0}
                      defaultOpen
                      hideHeader
                      onItemWithImageClick={
                        restaurant.open_bottom_sheet_on_click !== false
                          ? (item) => {
                              void trackRestaurantEvent({
                                restaurantSlug: restaurant.slug,
                                eventType: "item_open",
                                itemId: item.id,
                              });
                              setSelectedItem(item);
                            }
                          : undefined
                      }
                    />
                  </motion.div>
                );
              })()
            ) : filteredCategories.length > 0 ? (
              <CategoryGrid
                key="grid"
                categories={filteredCategories}
                onSelect={(id) => setSelectedCategoryId(id)}
              />
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-8 text-center text-muted-foreground"
              >
                {hasActiveFilters
                  ? "No menu items match your current filters."
                  : "No menu items available."}
              </motion.p>
            )}
          </AnimatePresence>
        ) : filteredCategories.length > 0 ? (
          <div className="mt-8">
            {filteredCategories.map((category, index) => (
              <MenuSection
                key={category.id}
                title={category.name}
                items={formattedCategoryItemsById.get(category.id) ?? []}
                delay={0.03 + index * 0.1}
                defaultOpen={index === 0}
                onItemWithImageClick={
                  restaurant.open_bottom_sheet_on_click !== false
                    ? (item) => {
                        void trackRestaurantEvent({
                          restaurantSlug: restaurant.slug,
                          eventType: "item_open",
                          itemId: item.id,
                        });
                        setSelectedItem(item);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-8">
            {hasActiveFilters
              ? "No menu items match your current filters."
              : "No menu items available."}
          </p>
        )}

        <footer className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm mb-2">
            {restaurant.open_hours}
          </p>
          <p className="text-muted-foreground/60 text-xs">
            {restaurant.footer_quote}
          </p>
          {restaurant.show_branding !== false && (
            <div className="mt-6">
              <a
                href="https://menucup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                Powered by
                <span className="font-bold tracking-tight">MenuCup</span>
              </a>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                  : "border-white/10 bg-black/10 text-muted-foreground hover:border-[var(--accent)]/40 hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
