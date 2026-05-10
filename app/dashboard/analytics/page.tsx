"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Circle,
  Crown,
  Gauge,
  Image as ImageIcon,
  Minus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useDashboard } from "@/src/components/dashboard/DashboardProvider";
import {
  AiInsight,
  ItemAnalyticsResponse,
  MenuScoreBreakdown,
  Restaurant,
  RestaurantAnalyticsSummary,
} from "@/src/types";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { tierAtLeast } from "@/lib/subscription";

function AnalyticsContent({ selectedRestaurant }: { selectedRestaurant: Restaurant }) {
  const [analytics, setAnalytics] = useState<RestaurantAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [items, setItems] = useState<ItemAnalyticsResponse | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [score, setScore] = useState<{ score: number; breakdown: MenuScoreBreakdown } | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsGeneratedAt, setInsightsGeneratedAt] = useState<string | null>(null);

  const isProTier = tierAtLeast(selectedRestaurant.subscription_tier ?? "basic", "pro");
  const isBusinessTier = tierAtLeast(selectedRestaurant.subscription_tier ?? "basic", "business");

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

  const fetchItemAnalytics = useCallback(async () => {
    if (!isProTier) {
      setItems(null);
      return;
    }
    setItemsLoading(true);
    try {
      const response = await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/analytics/items?days=30`
      );
      if (!response.ok) {
        if (response.status !== 402) {
          console.error("Failed to fetch item analytics", response.status);
        }
        setItems(null);
        return;
      }
      const data = (await response.json()) as ItemAnalyticsResponse;
      setItems(data);
    } catch (error) {
      console.error("Error fetching item analytics:", error);
      setItems(null);
    } finally {
      setItemsLoading(false);
    }
  }, [selectedRestaurant.slug, isProTier]);

  const fetchScore = useCallback(async (recalc = false) => {
    if (!isProTier) {
      setScore(null);
      return;
    }
    setScoreLoading(true);
    try {
      const response = await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/score`,
        { method: recalc ? "POST" : "GET" }
      );
      if (!response.ok) {
        setScore(null);
        return;
      }
      const data = (await response.json()) as {
        score: number;
        breakdown: MenuScoreBreakdown;
      };
      setScore(data);
    } catch (error) {
      console.error("Error fetching menu score:", error);
      setScore(null);
    } finally {
      setScoreLoading(false);
    }
  }, [selectedRestaurant.slug, isProTier]);

  const fetchInsights = useCallback(async (regenerate = false) => {
    if (!isBusinessTier) {
      setInsights([]);
      setInsightsGeneratedAt(null);
      return;
    }
    setInsightsLoading(true);
    try {
      const response = await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/ai-insights`,
        { method: regenerate ? "POST" : "GET" }
      );
      if (!response.ok) {
        setInsights([]);
        return;
      }
      const data = (await response.json()) as {
        insights: AiInsight[];
        generated_at: string | null;
      };
      setInsights(data.insights);
      setInsightsGeneratedAt(data.generated_at);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }, [selectedRestaurant.slug, isBusinessTier]);

  const updateInsightStatus = useCallback(
    async (insightId: string, status: "done" | "dismissed") => {
      try {
        await fetch(
          `/api/restaurants/${selectedRestaurant.slug}/ai-insights/${insightId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        );
        setInsights((current) => current.filter((insight) => insight.id !== insightId));
      } catch (error) {
        console.error("Error updating insight:", error);
      }
    },
    [selectedRestaurant.slug]
  );

  useEffect(() => {
    void fetchAnalytics();
    void fetchItemAnalytics();
    void fetchScore();
    void fetchInsights();
  }, [fetchAnalytics, fetchItemAnalytics, fetchScore, fetchInsights]);

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
            onClick={() => {
              void fetchAnalytics();
              void fetchItemAnalytics();
              void fetchScore();
            }}
            disabled={analyticsLoading || itemsLoading || scoreLoading}
          >
            <RefreshCw className={`h-4 w-4 ${analyticsLoading || itemsLoading || scoreLoading ? "animate-spin" : ""}`} />
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

      {isProTier ? (
        <>
          <MenuScoreCard
            score={score}
            loading={scoreLoading}
            onRecalculate={() => void fetchScore(true)}
          />
          {isBusinessTier ? (
            <AiInsightsCard
              insights={insights}
              loading={insightsLoading}
              generatedAt={insightsGeneratedAt}
              onRegenerate={() => void fetchInsights(true)}
              onUpdate={updateInsightStatus}
            />
          ) : (
            <UpgradeBusinessCard />
          )}
          <AdvancedAnalyticsSection items={items} loading={itemsLoading} />
        </>
      ) : (
        <UpgradeAnalyticsCard />
      )}
    </div>
  );
}

function UpgradeBusinessCard() {
  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
      <CardContent className="flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/10 p-3 text-indigo-200">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Insights for Owners</h3>
            <p className="mt-1 max-w-xl text-sm text-indigo-100/80">
              Get GPT-powered, action-ready recommendations: which items to promote, what is
              missing an image, what to consider hiding. Available on the Business plan.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="uppercase tracking-widest">
          Business
        </Badge>
      </CardContent>
    </Card>
  );
}

function AiInsightsCard({
  insights,
  loading,
  generatedAt,
  onRegenerate,
  onUpdate,
}: {
  insights: AiInsight[];
  loading: boolean;
  generatedAt: string | null;
  onRegenerate: () => void;
  onUpdate: (id: string, status: "done" | "dismissed") => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">AI Insights</h2>
        <Badge variant="secondary" className="ml-2 uppercase tracking-widest">Business</Badge>
        <div className="ml-auto flex items-center gap-3">
          {generatedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {new Date(generatedAt).toLocaleString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>
      </div>

      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardContent className="p-6">
          {loading && insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Asking the model...</p>
          ) : insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No insights yet. Add a few menu items and let traffic flow, then click Regenerate.
            </p>
          ) : (
            <ul className="space-y-3">
              {insights.map((insight) => (
                <li
                  key={insight.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                      {String(insight.recommendation_type).replace(/_/g, " ")}
                    </span>
                    <p className="mt-1 text-sm">{insight.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate(insight.id, "done")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate(insight.id, "dismissed")}
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function MenuScoreCard({
  score,
  loading,
  onRecalculate,
}: {
  score: { score: number; breakdown: MenuScoreBreakdown } | null;
  loading: boolean;
  onRecalculate: () => void;
}) {
  const value = score?.score ?? 0;
  const tone =
    value >= 80
      ? "text-emerald-600"
      : value >= 50
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Gauge className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">Menu Performance Score</h2>
        <Badge variant="secondary" className="ml-2 uppercase tracking-widest">Pro</Badge>
      </div>

      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[280px_1fr]">
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`text-7xl font-black ${tone}`}>
              {loading && !score ? "..." : value}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">out of 100</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onRecalculate}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Recalculate
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Breakdown
              </h3>
              <ul className="mt-3 space-y-2">
                {(score?.breakdown.items ?? []).map((item) => {
                  const complete = item.earned >= item.points;
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      {complete ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.earned}/{item.points}
                          </span>
                        </div>
                        {item.detail && (
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {score?.breakdown.suggestions && score.breakdown.suggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  How to improve
                </h3>
                <ul className="mt-3 space-y-2">
                  {score.breakdown.suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm"
                    >
                      {suggestion.href ? (
                        <a
                          href={suggestion.href}
                          className="text-primary hover:underline"
                        >
                          {suggestion.message}
                        </a>
                      ) : (
                        suggestion.message
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function UpgradeAnalyticsCard() {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-indigo-50 to-white">
      <CardContent className="flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Unlock Advanced Analytics</h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              See per-item trends, low performers, time-of-day heatmaps, category breakdowns
              and upsell conversion. Available on the Pro plan.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="uppercase tracking-widest">
          Pro feature
        </Badge>
      </CardContent>
    </Card>
  );
}

function AdvancedAnalyticsSection({
  items,
  loading,
}: {
  items: ItemAnalyticsResponse | null;
  loading: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">Advanced Analytics</h2>
        <Badge variant="secondary" className="ml-2 uppercase tracking-widest">Pro</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AnalyticsCard
          title="Upsell Impressions"
          value={loading ? "..." : String(items?.upsell.impressions ?? 0)}
          description={`Last ${items?.days ?? 30} days`}
        />
        <AnalyticsCard
          title="Upsell Taps"
          value={loading ? "..." : String(items?.upsell.taps ?? 0)}
          description="Customer clicks on suggestions"
        />
        <AnalyticsCard
          title="Upsell CTR"
          value={
            loading
              ? "..."
              : `${Math.round((items?.upsell.conversion_rate ?? 0) * 1000) / 10}%`
          }
          description="Tap rate of upsell row"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Top Items (with 7-day trend)</CardTitle>
            <CardDescription>
              Compares the last 7 days to the previous 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : items?.topItems.length ? (
              <div className="space-y-2">
                {items.topItems.slice(0, 10).map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.item_name}</p>
                      {item.category_name && (
                        <p className="text-xs text-muted-foreground">
                          {item.category_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <TrendArrow trend={item.trend} delta={item.delta} />
                      <span className="font-semibold">{item.total_opens} opens</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No item data yet. Once guests open items on the public menu, rankings will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Low Performers</CardTitle>
            <CardDescription>
              Items with zero opens in the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : items?.lowPerformers.length ? (
              <ul className="space-y-2">
                {items.lowPerformers.map((item) => (
                  <li
                    key={item.item_id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category_name ?? "Uncategorized"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-xs">
                      {!item.has_image && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                          <ImageIcon className="h-3 w-3" /> No image
                        </span>
                      )}
                      {!item.has_description && (
                        <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                          No description
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Every item has been viewed in the last 30 days. Nice work.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Activity by Hour</CardTitle>
            <CardDescription>When guests open the menu most.</CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap rows={items?.heatmap ?? []} loading={loading} />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
            <CardDescription>Opens per category in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : items?.categoryBreakdown.length ? (
              <CategoryBars rows={items.categoryBreakdown} />
            ) : (
              <p className="text-sm text-muted-foreground">No category data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function TrendArrow({
  trend,
  delta,
}: {
  trend: "up" | "down" | "flat";
  delta: number;
}) {
  const sign = delta > 0 ? `+${delta}` : String(delta);
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <ArrowUpRight className="h-4 w-4" /> {sign}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-rose-600">
        <ArrowDownRight className="h-4 w-4" /> {sign}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" /> 0
    </span>
  );
}

function Heatmap({
  rows,
  loading,
}: {
  rows: { hour: number; opens: number; views: number }[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.opens));
  return (
    <div className="grid grid-cols-12 gap-1">
      {rows.map((row) => {
        const intensity = row.opens / max;
        const opacity = row.opens === 0 ? 0.06 : 0.2 + intensity * 0.8;
        return (
          <div key={row.hour} className="flex flex-col items-center gap-1">
            <div
              className="h-10 w-full rounded-md bg-primary"
              style={{ opacity }}
              title={`${row.hour}:00 — ${row.opens} opens, ${row.views} views`}
            />
            <span className="text-[10px] text-muted-foreground">
              {row.hour.toString().padStart(2, "0")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBars({
  rows,
}: {
  rows: { category_id: string; category_name: string; opens: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.opens));
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.category_id} className="flex items-center gap-3">
          <div className="w-32 shrink-0 truncate text-sm">{row.category_name}</div>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-muted">
            <div
              className="absolute inset-y-0 left-0 bg-primary/80"
              style={{ width: `${(row.opens / max) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-semibold">{row.opens}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { selectedRestaurant } = useDashboard();
  if (!selectedRestaurant) return null;
  return <AnalyticsContent selectedRestaurant={selectedRestaurant} />;
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
