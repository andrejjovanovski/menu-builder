"use client";

import { createContext, ReactNode, useContext } from "react";
import { useDashboardRestaurants } from "@/hooks/useDashboardRestaurants";

type DashboardContextValue = ReturnType<typeof useDashboardRestaurants>;

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboardRestaurants();
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used inside <DashboardProvider>");
  }
  return ctx;
}
