"use client";

import { ReactNode, useEffect, useMemo } from "react";
import {
  BarChart3,
  BellRing,
  Building2,
  CreditCard,
  Megaphone,
  QrCode,
  Settings,
  Store,
  Utensils,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { MenuSidebar } from "@/src/components/menu-builder/MenuSidebar";
import { useDashboardRestaurants } from "@/hooks/useDashboardRestaurants";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { ThemeToggle } from "@/src/components/ui/theme-toggle";

type SectionKey = "menu-builder" | "analytics" | "settings" | "qr" | "payments" | "requests" | "promotions";

interface DashboardShellProps {
  section: SectionKey;
  children: (context: ReturnType<typeof useDashboardRestaurants>) => ReactNode;
}

export function DashboardShell({ section, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dashboard = useDashboardRestaurants();

  useEffect(() => {
    if (!dashboard.loading && !dashboard.user) {
      router.push("/login");
    }
  }, [dashboard.loading, dashboard.user, router]);

  const navigationItems = useMemo(() => {
    const items = [
      {
        href: dashboard.buildSectionHref("/dashboard/menu-builder"),
        icon: Utensils,
        label: "Menu Builder",
      },
      {
        href: dashboard.buildSectionHref("/dashboard/analytics"),
        icon: BarChart3,
        label: "Analytics",
      },
      {
        href: dashboard.buildSectionHref("/dashboard/settings"),
        icon: Settings,
        label: "Settings",
      },
      {
        href: dashboard.buildSectionHref("/dashboard/qr"),
        icon: QrCode,
        label: "QR Codes",
      },
      {
        href: dashboard.buildSectionHref("/dashboard/requests"),
        icon: BellRing,
        label: "Requests",
      },
      {
        href: dashboard.buildSectionHref("/dashboard/promotions"),
        icon: Megaphone,
        label: "Promotions",
      },
    ];

    if (dashboard.userRole === "admin") {
      items.push({
        href: dashboard.buildSectionHref("/dashboard/payments"),
        icon: CreditCard,
        label: "Payments",
      });
    }

    return items;
  }, [dashboard]);

  if (dashboard.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <MenuSidebar
        restaurants={dashboard.restaurants}
        selectedId={dashboard.selectedRestaurant?.id}
        onSelect={dashboard.selectRestaurant}
        onRefresh={dashboard.fetchRestaurants}
        onLogout={dashboard.logout}
        userRole={dashboard.userRole}
        paymentStatusByRestaurantId={dashboard.paymentStatusByRestaurantId}
        navigationItems={navigationItems}
        currentPath={pathname}
      />

      <main className="min-w-0 flex-1 overflow-y-auto bg-background text-foreground">
        {!dashboard.selectedRestaurant ? (
          <div className="flex h-full items-center justify-center p-12 text-center">
            <Card className="max-w-md border-border/70 bg-card/80 backdrop-blur">
              <CardContent className="p-8">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold">No Restaurant Selected</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a venue from the sidebar to continue.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="min-h-full p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <Card className="border-border/70 bg-card/80 backdrop-blur">
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="uppercase tracking-widest">
                        Dashboard
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {section.replace("-", " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                          {dashboard.selectedRestaurant.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          Active workspace for `{dashboard.selectedRestaurant.slug}`
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                  </div>
                </CardContent>
              </Card>

              {children(dashboard)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
