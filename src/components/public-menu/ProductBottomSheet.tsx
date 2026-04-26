"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { toTagLabel } from "@/src/utils/menuTags";
import { UpsellItem } from "@/src/types";
import { trackRestaurantEvent } from "@/src/utils/analytics";

export interface ProductBottomSheetItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  dietary_tags?: string[];
  allergen_tags?: string[];
  is_available?: boolean;
  is_best_seller?: boolean;
  is_new?: boolean;
  is_trending?: boolean;
}

interface ProductBottomSheetProps {
  item: ProductBottomSheetItem | null;
  onClose: () => void;
  restaurantSlug: string;
  onUpsellClick?: (item: ProductBottomSheetItem) => void;
}

function HighlightBadge({ item }: { item: ProductBottomSheetItem }) {
  if (item.is_trending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-300 border border-orange-500/30">
        🔥 Trending
      </span>
    );
  }
  if (item.is_best_seller) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
        ⭐ Best Seller
      </span>
    );
  }
  if (item.is_new) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
        ✨ New
      </span>
    );
  }
  return null;
}

export default function ProductBottomSheet({
  item,
  onClose,
  restaurantSlug,
  onUpsellClick,
}: ProductBottomSheetProps) {
  const [upsells, setUpsells] = useState<UpsellItem[]>([]);
  const [upsellsTracked, setUpsellsTracked] = useState(false);

  useEffect(() => {
    if (!item) {
      setUpsells([]);
      setUpsellsTracked(false);
      return;
    }

    let cancelled = false;

    async function fetchUpsells() {
      if (!item) return;
      try {
        const res = await fetch(
          `/api/restaurants/${restaurantSlug}/items/${item.id}/upsells`
        );
        if (!res.ok || cancelled) return;
        const data: UpsellItem[] = await res.json();
        if (!cancelled) {
          setUpsells(data);
          setUpsellsTracked(false);
        }
      } catch {
        // silently ignore
      }
    }

    void fetchUpsells();
    return () => { cancelled = true; };
  }, [item?.id, restaurantSlug]);

  // Track upsell impression once upsells are visible
  useEffect(() => {
    if (upsells.length > 0 && item && !upsellsTracked) {
      void trackRestaurantEvent({
        restaurantSlug,
        eventType: "upsell_impression",
        itemId: item.id,
      });
      setUpsellsTracked(true);
    }
  }, [upsells, item, upsellsTracked, restaurantSlug]);

  const handleUpsellTap = (upsell: UpsellItem) => {
    if (item) {
      void trackRestaurantEvent({
        restaurantSlug,
        eventType: "upsell_tap",
        itemId: upsell.id,
      });
    }
    if (onUpsellClick) {
      onUpsellClick({
        id: upsell.id,
        name: upsell.name,
        description: upsell.description || "",
        price: `${Number(upsell.price).toFixed(0)} ден.`,
        image: upsell.image_url,
        is_available: upsell.is_available,
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {item && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-3xl bg-[var(--card)] shadow-2xl border-t border-accent/20"
          >
            <div className="flex flex-col h-full max-h-[88vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/20 flex items-center justify-center text-foreground hover:bg-black/30 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              {item.image && (
                <div className="relative w-full aspect-[4/3] min-h-[220px] bg-muted/20 shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    fetchPriority="high"
                    decoding="async"
                  />
                  {item.is_available === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                      <span className="rounded-full bg-accent/90 px-4 py-2 text-sm font-semibold text-accent-foreground shadow-lg">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-5 pb-8">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="font-display text-xl md:text-2xl text-foreground">
                    {item.name}
                  </h2>
                  <span className="shrink-0 font-sans text-lg font-semibold text-[var(--accent)]">
                    {item.price}
                  </span>
                </div>

                {(item.is_trending || item.is_best_seller || item.is_new) && (
                  <div className="mb-3">
                    <HighlightBadge item={item} />
                  </div>
                )}

                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.description || "No description."}
                </p>

                {(item.dietary_tags?.length || item.allergen_tags?.length) ? (
                  <div className="mt-4 space-y-3">
                    {!!item.dietary_tags?.length && (
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                          Dietary
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.dietary_tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                            >
                              {toTagLabel(tag, "dietary")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!item.allergen_tags?.length && (
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                          Allergens
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.allergen_tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200"
                            >
                              {toTagLabel(tag, "allergen")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {upsells.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      You might also like
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                      {upsells.map((upsell) => (
                        <button
                          key={upsell.id}
                          type="button"
                          onClick={() => handleUpsellTap(upsell)}
                          className="shrink-0 w-28 rounded-xl border border-accent/20 bg-black/20 overflow-hidden text-left hover:border-accent/50 transition-colors"
                        >
                          {upsell.image_url ? (
                            <div className="relative w-full aspect-square overflow-hidden">
                              <Image
                                src={upsell.image_url}
                                alt={upsell.name}
                                fill
                                className="object-cover"
                                sizes="112px"
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-accent/10 flex items-center justify-center text-2xl">
                              🍽️
                            </div>
                          )}
                          <div className="p-2">
                            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">
                              {upsell.name}
                            </p>
                            <p className="mt-1 text-xs font-bold text-[var(--accent)]">
                              {Number(upsell.price).toFixed(0)} ден.
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
