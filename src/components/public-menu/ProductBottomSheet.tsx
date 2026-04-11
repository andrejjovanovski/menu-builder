"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toTagLabel } from "@/src/utils/menuTags";

export interface ProductBottomSheetItem {
  name: string;
  description: string;
  price: string;
  image?: string;
  dietary_tags?: string[];
  allergen_tags?: string[];
  is_available?: boolean;
}

interface ProductBottomSheetProps {
  item: ProductBottomSheetItem | null;
  onClose: () => void;
}

export default function ProductBottomSheet({ item, onClose }: ProductBottomSheetProps) {
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
                  {/* Native img so the same URL as the card is shown immediately from cache during the opening animation */}
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
