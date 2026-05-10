import { NextResponse } from "next/server";
import type { SubscriptionTier } from "@/src/types";

export const TIER_RANK: Record<SubscriptionTier, number> = {
  basic: 0,
  pro: 1,
  business: 2,
};

export function tierAtLeast(
  current: SubscriptionTier | undefined | null,
  required: SubscriptionTier
): boolean {
  const tier = (current ?? "basic") as SubscriptionTier;
  return TIER_RANK[tier] >= TIER_RANK[required];
}

export function requireTier(
  restaurant: { subscription_tier?: SubscriptionTier | null } | null | undefined,
  required: SubscriptionTier
) {
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }
  if (!tierAtLeast(restaurant.subscription_tier ?? "basic", required)) {
    return NextResponse.json(
      {
        error: "Upgrade required",
        required_tier: required,
        current_tier: restaurant.subscription_tier ?? "basic",
      },
      { status: 402 }
    );
  }
  return null;
}
