"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/src/components/dashboard/DashboardShell";
import { Restaurant, RestaurantAnalyticsSummary } from "@/src/types";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

function AnalyticsContent({ selectedRestaurant }: { selectedRestaurant: Restaurant }) {
  const [analytics, setAnalytics] = useState<RestaurantAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/analytics?days=30`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = (await response.json()) as RestaurantAnalyticsSummary;
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedRestaurant.slug]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <Badge variant="secondary" className="uppercase tracking-widest">
              Analytics
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {selectedRestaurant.name}
            </h1>
            <CardDescription className="mt-2 max-w-2xl">
              See how guests interact with the public menu over the last 30 days.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchAnalytics()}
            disabled={analyticsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            Performance Snapshot
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AnalyticsCard
            title="Menu Views"
            value={analyticsLoading ? "..." : String(analytics?.totals.menuViews ?? 0)}
            description="Public menu visits"
          />
          <AnalyticsCard
            title="Item Opens"
            value={analyticsLoading ? "..." : String(analytics?.totals.itemOpens ?? 0)}
            description="Dish detail opens"
          />
          <AnalyticsCard
            title="AI Requests"
            value={
              analyticsLoading
                ? "..."
                : String(analytics?.totals.recommendationRequests ?? 0)
            }
            description="Recommendation questions"
          />
          <AnalyticsCard
            title="Feedback Votes"
            value={analyticsLoading ? "..." : String(analytics?.feedback.total ?? 0)}
            description="Quick guest reactions"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="border-border/70 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Most Opened Dishes</CardTitle>
              <CardDescription>What guests inspect most often.</CardDescription>
            </CardHeader>
            <CardContent>
            <h3 className="hidden">
              Most Opened Dishes
            </h3>
            {analyticsLoading ? (
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            ) : analytics?.topItems.length ? (
              <div className="space-y-3">
                {analytics.topItems.map((item, index) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {item.item_name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.opens} opens
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No analytics yet. Once guests open the public menu, activity will
                appear here.
              </p>
            )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Guest Feedback</CardTitle>
              <CardDescription>Fast reactions after menu browsing.</CardDescription>
            </CardHeader>
            <CardContent>
            <h3 className="hidden">
              Guest Feedback
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <FeedbackBreakdownCard
                label="Loved it"
                value={analyticsLoading ? "..." : String(analytics?.feedback.love ?? 0)}
                tone="green"
              />
              <FeedbackBreakdownCard
                label="It was okay"
                value={analyticsLoading ? "..." : String(analytics?.feedback.okay ?? 0)}
                tone="amber"
              />
              <FeedbackBreakdownCard
                label="Hard to use"
                value={
                  analyticsLoading ? "..." : String(analytics?.feedback.hardToUse ?? 0)
                }
                tone="red"
              />
            </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <DashboardShell section="analytics">
      {({ selectedRestaurant }) => <AnalyticsContent selectedRestaurant={selectedRestaurant!} />}
    </DashboardShell>
  );
}

function AnalyticsCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur">
      <CardContent className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeedbackBreakdownCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red";
}) {
  const toneClasses = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${toneClasses}`}
      >
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}
