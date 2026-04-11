"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Smile, TriangleAlert, X } from "lucide-react";
import { getAnalyticsSessionId } from "@/src/utils/analytics";

type FeedbackRating = "love" | "okay" | "hard_to_use";

const OPTIONS: Array<{
  value: FeedbackRating;
  label: string;
  description: string;
  icon: typeof Heart;
}> = [
  {
    value: "love",
    label: "Loved it",
    description: "Easy and enjoyable",
    icon: Heart,
  },
  {
    value: "okay",
    label: "It was okay",
    description: "Worked fine",
    icon: Smile,
  },
  {
    value: "hard_to_use",
    label: "Hard to use",
    description: "Could be clearer",
    icon: TriangleAlert,
  },
];

interface Props {
  restaurantSlug: string;
}

function getStorageKey(slug: string) {
  return `menucup_feedback_submitted_${slug}`;
}

export function FeedbackPrompt({ restaurantSlug }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(null);

  const storageKey = useMemo(() => getStorageKey(restaurantSlug), [restaurantSlug]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [storageKey]);

  const hidePrompt = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "dismissed");
    }
    setIsVisible(false);
  };

  const submitFeedback = async (rating: FeedbackRating) => {
    if (isSubmitting) {
      return;
    }

    setSelectedRating(rating);
    setIsSubmitting(true);

    try {
      await fetch(`/api/restaurants/${restaurantSlug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          session_id: getAnalyticsSessionId(),
        }),
      });
    } finally {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(storageKey, "submitted");
      }
      setTimeout(() => setIsVisible(false), 900);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-[28px] border border-accent/20 p-4 shadow-2xl"
          style={{ backgroundColor: "var(--card)", color: "var(--foreground)" }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                Quick feedback
              </p>
              <h3 className="mt-1 text-lg font-semibold">How was this menu?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                One tap is enough.
              </p>
            </div>
            <button
              type="button"
              onClick={hidePrompt}
              className="rounded-full p-2 text-muted-foreground hover:bg-white/5"
              aria-label="Close feedback prompt"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = selectedRating === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void submitFeedback(option.value)}
                  disabled={isSubmitting}
                  className={`rounded-2xl border px-3 py-4 text-left transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/15"
                      : "border-white/10 bg-black/10 hover:border-[var(--accent)]/40 hover:bg-white/5"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <Icon size={18} className="text-[var(--accent)]" />
                  <p className="mt-3 text-sm font-semibold">{option.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
