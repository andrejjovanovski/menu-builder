"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X, CheckCircle2, Loader2, Receipt } from "lucide-react";

interface CallWaiterSheetProps {
  restaurantSlug: string;
  tableIdentifier: string | null;
}

type SheetState = "idle" | "open" | "loading" | "success";

export function CallWaiterSheet({ restaurantSlug, tableIdentifier }: CallWaiterSheetProps) {
  const [state, setState] = useState<SheetState>("idle");

  const handleRequest = async (requestType: "call_waiter" | "ask_for_bill") => {
    setState("loading");
    try {
      const res = await fetch(`/api/restaurants/${restaurantSlug}/table-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: requestType,
          table_identifier: tableIdentifier,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("open");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {state === "open" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setState("idle")}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {(state === "open" || state === "loading" || state === "success") && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[var(--card)] border-t border-accent/20 shadow-2xl p-6 pb-10"
          >
            {state === "success" ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
                <p className="text-lg font-bold text-foreground">Request sent!</p>
                <p className="text-sm text-muted-foreground">
                  Staff has been notified
                  {tableIdentifier ? ` for table ${tableIdentifier}` : ""}.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-accent font-bold">
                      {tableIdentifier ? `Table ${tableIdentifier}` : "Quick request"}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">How can we help?</p>
                  </div>
                  <button
                    onClick={() => setState("idle")}
                    className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRequest("call_waiter")}
                    disabled={state === "loading"}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors disabled:opacity-60"
                  >
                    {state === "loading" ? (
                      <Loader2 size={28} className="text-accent animate-spin" />
                    ) : (
                      <BellRing size={28} className="text-accent" />
                    )}
                    <span className="text-sm font-bold text-foreground">Call Waiter</span>
                  </button>
                  <button
                    onClick={() => handleRequest("ask_for_bill")}
                    disabled={state === "loading"}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors disabled:opacity-60"
                  >
                    {state === "loading" ? (
                      <Loader2 size={28} className="text-accent animate-spin" />
                    ) : (
                      <Receipt size={28} className="text-accent" />
                    )}
                    <span className="text-sm font-bold text-foreground">Ask for Bill</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <AnimatePresence>
        {state === "idle" && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setState("open")}
            className="fixed bottom-6 right-5 z-40 flex items-center gap-2 px-4 h-12 rounded-full shadow-lg border border-accent/20 transition-transform"
            style={{ backgroundColor: "var(--card)" }}
          >
            <BellRing size={18} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
              Call Waiter
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
