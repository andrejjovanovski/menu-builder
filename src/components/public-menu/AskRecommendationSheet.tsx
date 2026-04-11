"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Sparkles, X } from "lucide-react";
import { trackRestaurantEvent } from "@/src/utils/analytics";

interface Props {
  restaurantSlug: string;
  restaurantName: string;
}

const starterPrompts = [
  "What is the best first-time order here?",
  "Recommend something light and fresh.",
  "What should I get if I want something filling?",
  "Suggest a good dish for sharing.",
];

export function AskRecommendationSheet({
  restaurantSlug,
  restaurantName,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submitQuestion = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setQuestion(trimmed);
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/restaurants/${restaurantSlug}/recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Could not get a recommendation");
      }

      setAnswer(data.answer || "");
      void trackRestaurantEvent({
        restaurantSlug,
        eventType: "recommendation_request",
        metadata: { question: trimmed },
      });
    } catch (err) {
      setAnswer("");
      setError(err instanceof Error ? err.message : "Could not get a recommendation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-5 z-40">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-accent/20 px-4 py-3 shadow-xl"
          style={{ backgroundColor: "var(--card)", color: "var(--accent)" }}
        >
          <Sparkles size={18} />
          <span className="text-sm font-semibold">Ask for a recommendation</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-xl rounded-[28px] border border-white/10 p-5 shadow-2xl"
              style={{ backgroundColor: "var(--card)", color: "var(--foreground)" }}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                    <MessageCircle size={14} />
                    AI Menu Guide
                  </p>
                  <h3 className="text-xl font-semibold">{restaurantName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ask what to order and get recommendations from this menu.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitQuestion(prompt)}
                    className="rounded-full border border-accent/20 px-3 py-2 text-xs text-muted-foreground transition hover:bg-accent/10 hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitQuestion(question);
                }}
                className="space-y-3"
              >
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask something like: What should I get if I want something spicy and not too heavy?"
                  className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-accent/50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Get recommendation
                </button>
              </form>

              {(answer || error || isLoading) && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" />
                      Thinking through the menu...
                    </div>
                  ) : error ? (
                    <p className="text-sm text-red-300">{error}</p>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {answer}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
