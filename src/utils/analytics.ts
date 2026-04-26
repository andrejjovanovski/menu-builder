"use client";

const SESSION_KEY = "menucup_analytics_session_id";

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const nextValue = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, nextValue);
  return nextValue;
}

export async function trackRestaurantEvent(params: {
  restaurantSlug: string;
  eventType: "menu_view" | "item_open" | "recommendation_request" | "upsell_impression" | "upsell_tap";
  itemId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await fetch(`/api/restaurants/${params.restaurantSlug}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: params.eventType,
        item_id: params.itemId,
        session_id: getAnalyticsSessionId(),
        metadata: params.metadata ?? {},
      }),
      keepalive: true,
    });
  } catch {
    // Never interrupt the user flow for analytics.
  }
}
