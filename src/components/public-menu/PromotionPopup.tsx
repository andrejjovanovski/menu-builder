"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Promotion } from "@/src/types";

interface PromotionPopupProps {
  promotions: Promotion[];
  restaurantId: string;
}

const SESSION_KEY_PREFIX = "mc:promo-shown:";

function shouldShow(promo: Promotion): boolean {
  if (typeof window === "undefined") return false;
  if (promo.display_frequency === "every_load") return true;
  return window.sessionStorage.getItem(`${SESSION_KEY_PREFIX}${promo.id}`) !== "1";
}

export default function PromotionPopup({ promotions, restaurantId: _restaurantId }: PromotionPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [queue, setQueue] = useState<Promotion[]>([]);
  const [visible, setVisible] = useState(false);

  const allPromotions = useMemo(() => promotions, [promotions]);

  useEffect(() => {
    if (allPromotions.length === 0) return;
    if (typeof window === "undefined") return;

    const filtered = allPromotions.filter(shouldShow);
    if (filtered.length === 0) return;

    setQueue(filtered);
    setCurrentIndex(0);
    setVisible(true);
  }, [allPromotions]);

  useEffect(() => {
    if (!visible) return;
    const promo = queue[currentIndex];
    if (!promo) return;
    setSecondsLeft(promo.duration_seconds);
  }, [visible, currentIndex, queue]);

  useEffect(() => {
    if (!visible || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [visible, secondsLeft]);

  if (!visible || queue.length === 0) return null;

  const promo = queue[currentIndex];
  if (!promo) return null;

  const canDismiss = secondsLeft <= 0;
  const isLast = currentIndex >= queue.length - 1;

  const handleDismiss = () => {
    if (!canDismiss) return;

    if (promo.display_frequency === "once_per_session") {
      try {
        window.sessionStorage.setItem(`${SESSION_KEY_PREFIX}${promo.id}`, "1");
      } catch {
        // sessionStorage unavailable (private mode); fail open
      }
    }

    if (isLast) {
      setVisible(false);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="promo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            key={`promo-${promo.id}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[var(--card)] border border-accent/20 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleDismiss}
              disabled={!canDismiss}
              aria-label={canDismiss ? "Dismiss" : `Dismiss available in ${secondsLeft}s`}
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur transition-opacity disabled:cursor-not-allowed"
              style={{ opacity: canDismiss ? 1 : 0.85 }}
            >
              {canDismiss ? <X size={18} /> : secondsLeft}
            </button>

            <img
              src={promo.image_url}
              alt="Promotion"
              className="block w-full h-auto max-h-[80vh] object-contain bg-black"
            />

            {queue.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {queue.map((_, idx) => (
                  <span
                    key={idx}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        idx === currentIndex ? "var(--accent)" : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
