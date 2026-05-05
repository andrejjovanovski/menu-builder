"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { Payment, PaymentStatusDisplay, Restaurant } from "@/src/types";
import { getPaymentDisplayStatus } from "@/src/utils/paymentStatus";

function withRestaurantSearch(
  pathname: string,
  searchParams: URLSearchParams,
  slug?: string | null
) {
  const next = new URLSearchParams(searchParams.toString());
  if (slug) {
    next.set("restaurant", slug);
  } else {
    next.delete("restaurant");
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function useDashboardRestaurants() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userRole, user, logout, loading: authLoading } = useAuth();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const restaurantsFetchedRef = useRef(false);

  const fetchRestaurants = useCallback(async () => {
    try {
      if (!user) {
        setRestaurants([]);
        setSelectedRestaurant(null);
        setLoading(false);
        return;
      }

      const data = await apiFetch<Restaurant[]>("/api/restaurants");
      setRestaurants(data || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPayments = useCallback(async () => {
    if (userRole !== "admin") {
      setPayments([]);
      return;
    }

    try {
      const data = await apiFetch<Payment[]>("/api/payments");
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, [userRole]);

  useEffect(() => {
    if (!authLoading && user && userRole !== null && !restaurantsFetchedRef.current) {
      restaurantsFetchedRef.current = true;
      void fetchRestaurants();
      void fetchPayments();
    }

    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, userRole, fetchRestaurants, fetchPayments]);

  useEffect(() => {
    if (restaurants.length === 0) {
      setSelectedRestaurant(null);
      return;
    }

    const requestedSlug = searchParams.get("restaurant");
    const match = requestedSlug
      ? restaurants.find((restaurant) => restaurant.slug === requestedSlug)
      : null;
    const nextRestaurant = match ?? restaurants[0];

    setSelectedRestaurant(nextRestaurant);

    if (requestedSlug !== nextRestaurant.slug) {
      router.replace(
        withRestaurantSearch(pathname, new URLSearchParams(searchParams.toString()), nextRestaurant.slug)
      );
    }
  }, [pathname, restaurants, router, searchParams]);

  const selectRestaurant = useCallback(
    (restaurant: Restaurant) => {
      setSelectedRestaurant(restaurant);
      router.push(
        withRestaurantSearch(pathname, new URLSearchParams(searchParams.toString()), restaurant.slug)
      );
    },
    [pathname, router, searchParams]
  );

  const buildSectionHref = useCallback(
    (sectionPath: string) =>
      withRestaurantSearch(
        sectionPath,
        new URLSearchParams(),
        selectedRestaurant?.slug ?? searchParams.get("restaurant")
      ),
    [searchParams, selectedRestaurant]
  );

  const paymentStatusByRestaurantId = useMemo((): Record<string, PaymentStatusDisplay> => {
    if (userRole !== "admin" || payments.length === 0) {
      return {};
    }

    const byRestaurant = new Map<string, Payment>();
    for (const payment of payments) {
      const existing = byRestaurant.get(payment.restaurant_id);
      if (!existing || new Date(payment.created_at) > new Date(existing.created_at)) {
        byRestaurant.set(payment.restaurant_id, payment);
      }
    }

    const result: Record<string, PaymentStatusDisplay> = {};
    byRestaurant.forEach((payment, restaurantId) => {
      result[restaurantId] = getPaymentDisplayStatus(payment);
    });
    return result;
  }, [payments, userRole]);

  return {
    authLoading,
    buildSectionHref,
    fetchPayments,
    fetchRestaurants,
    loading,
    logout,
    paymentStatusByRestaurantId,
    restaurants,
    searchParams,
    selectRestaurant,
    selectedRestaurant,
    setRestaurants,
    user,
    userRole,
  };
}
