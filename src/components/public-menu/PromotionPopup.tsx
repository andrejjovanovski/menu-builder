"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { Promotion } from "@/src/types";

interface PromotionPopupProps {
  promotions: Promotion[];
}

const SESSION_KEY_PREFIX = "mc:promo-shown:";

function shouldShow(promo: Promotion): boolean {
  if (typeof window === "undefined") return false;
  if (promo.display_frequency === "every_load") return true;
  return window.sessionStorage.getItem(`${SESSION_KEY_PREFIX}${promo.id}`) !== "1";
}

function PromotionCountdown({
  promotion,
  onDismiss,
}: {
  promotion: Promotion;
  onDismiss: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(promotion.duration_seconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const canDismiss = secondsLeft <= 0;

  return (
    <motion.div
      key={`promo-${promotion.id}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="relative w-full max-w-md overflow-hidden rounded-3xl border border-accent/20 bg-[var(--card)] shadow-2xl"
    >
      <button
        type="button"
        onClick={onDismiss}
        disabled={!canDismiss}
        aria-label={canDismiss ? "Dismiss" : `Dismiss available in ${secondsLeft}s`}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white backdrop-blur transition-opacity disabled:cursor-not-allowed"
        style={{ opacity: canDismiss ? 1 : 0.85 }}
      >
        {canDismiss ? <X size={18} /> : secondsLeft}
      </button>

      <div className="relative max-h-[80vh] min-h-[320px] w-full bg-black">
        <Image
          src={promotion.image_url}
          alt="Promotion"
          fill
          sizes="(min-width: 768px) 448px, calc(100vw - 32px)"
          className="object-contain"
        />
      </div>
    </motion.div>
  );
}

export default function PromotionPopup({ promotions }: PromotionPopupProps) {
  const [dismissedPromotionIds, setDismissedPromotionIds] = useState<string[]>([]);

  const queue = useMemo(() => {
    if (typeof window === "undefined") return [];

    const dismissedSet = new Set(dismissedPromotionIds);
    return promotions.filter(
      (promotion) => dismissedSet.has(promotion.id) === false && shouldShow(promotion)
    );
  }, [dismissedPromotionIds, promotions]);

  const promo = queue[0];
  if (!promo) return null;

  const handleDismiss = () => {
    if (promo.display_frequency === "once_per_session") {
      try {
        window.sessionStorage.setItem(`${SESSION_KEY_PREFIX}${promo.id}`, "1");
      } catch {
        // sessionStorage unavailable (private mode); fail open
      }
    }

    setDismissedPromotionIds((prev) => [...prev, promo.id]);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="promo-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-md">
          <PromotionCountdown key={promo.id} promotion={promo} onDismiss={handleDismiss} />

          {queue.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {queue.map((promotion, idx) => (
                <span
                  key={promotion.id}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      idx === 0 ? "var(--accent)" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
