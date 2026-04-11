"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Restaurant, MenuCategory, MenuItem } from "@/src/types";
import { useAuth } from "./useAuth";
import { apiFetch } from "@/lib/api";

export function useMenuBuilder() {
    const { userRole, user, logout, loading: authLoading } = useAuth();

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | string>("all");
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

    useEffect(() => {
        if (!authLoading && user && userRole !== null && !restaurantsFetchedRef.current) {
            restaurantsFetchedRef.current = true;
            void fetchRestaurants();
        }

        if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user, userRole, fetchRestaurants]);

    const selectRestaurant = useCallback(async (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setSearchTerm("");
        setActiveFilter("all");

        try {
            const catData = await apiFetch<MenuCategory[]>(
                `/api/restaurants/${restaurant.slug}/categories`
            );

            setCategories(catData || []);

            const itemResponses = await Promise.all(
                (catData || []).map((category) =>
                    apiFetch<MenuItem[]>(
                        `/api/restaurants/${restaurant.slug}/categories/${category.slug}/items`
                    )
                )
            );

            setItems(itemResponses.flat());
        } catch (error) {
            console.error("Error loading restaurant data:", error);
        }
    }, []);

    const deleteItemAction = async (id: string) => {
        try {
            await apiFetch<{ success: boolean }>(`/api/items/${id}`, {
                method: "DELETE",
            });
            setItems((prev) => prev.filter((item) => item.id !== id));
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    };

    const deleteCategoryAction = async (id: string) => {
        try {
            await apiFetch<{ success: boolean }>(`/api/categories/${id}`, {
                method: "DELETE",
            });
            setCategories((prev) => prev.filter((c) => c.id !== id));
            setItems((prev) => prev.filter((item) => item.category_id !== id));
            if (activeFilter === id) setActiveFilter("all");
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    };

    const moveItem = (index: number, direction: "up" | "down") => {
        const newItems = [...items];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setItems(newItems);
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeFilter === "all" || item.category_id === activeFilter;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, activeFilter]);

    return {
        restaurants,
        selectedRestaurant,
        categories,
        items,
        loading,
        searchTerm,
        setSearchTerm,
        activeFilter,
        setActiveFilter,
        filteredItems,
        fetchRestaurants,
        selectRestaurant,
        deleteItemAction,
        deleteCategoryAction,
        moveItem,
        setItems,
        setCategories,
        userRole,
        user,
        logout,
    };
}
