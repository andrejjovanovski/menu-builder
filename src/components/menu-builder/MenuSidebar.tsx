"use client";

import { useState } from "react";
import Link from "next/link";
import { LucideIcon, UtensilsCrossed, LogOut, Menu, X } from "lucide-react";
import { Restaurant } from "@/src/types";
import { CreateRestaurantForm } from "../forms/CreateRestaurantForm";
import { UserRole } from "@/src/types";
import type { PaymentStatusDisplay } from "@/src/types";
import { PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from "@/src/utils/paymentStatus";
import { cn } from "@/lib/utils";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface Props {
  restaurants: Restaurant[];
  selectedId?: string;
  onSelect: (r: Restaurant) => void;
  onRefresh: () => void;
  onLogout: () => void;
  userRole: UserRole;
  paymentStatusByRestaurantId?: Record<string, PaymentStatusDisplay>;
  navigationItems: NavigationItem[];
  currentPath: string;
}

export function MenuSidebar({
  restaurants,
  selectedId,
  onSelect,
  onRefresh,
  onLogout,
  userRole,
  paymentStatusByRestaurantId = {},
  navigationItems,
  currentPath,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-background p-2 shadow-sm transition-colors hover:bg-accent md:hidden"
        aria-label="Toggle menu"
      >
        {!isOpen && (
          <Menu className="h-6 w-6 text-foreground" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 z-40 flex h-screen w-80 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:relative ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="border-b border-sidebar-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sidebar-primary p-2 text-sidebar-primary-foreground shadow-sm">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Menu Studio</h2>
                <p className="text-xs text-muted-foreground">Restaurant workspace</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-sidebar-accent md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>

          {userRole === "admin" && (
            <CreateRestaurantForm onCreate={onRefresh} className="mt-6" />
          )}
        </div>

        {/* Middle Section: Scrollable Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {userRole === "admin" ? "All" : "My"} Restaurants
            </p>
            <div className="space-y-1">
              {restaurants.map((r) => {
                const paymentStatus = paymentStatusByRestaurantId[r.id];
                const active = selectedId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSelect(r);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {userRole === "admin" && paymentStatus != null && (
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${PAYMENT_STATUS_COLORS[paymentStatus]}`}
                          title={PAYMENT_STATUS_LABELS[paymentStatus]}
                        />
                      )}
                      <span className="truncate font-medium">{r.name}</span>
                    </span>
                    {active && <Badge variant="secondary">Open</Badge>}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedId && (
            <div>
              <Separator className="mb-6" />
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Workspace
              </p>
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const active = currentPath === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                        active
                          ? "bg-card text-card-foreground shadow-sm"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Section: Logout Button */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
