"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client"; // Standardized browser client
import { Restaurant, MenuCategory, MenuItem, UserRole } from "@/src/types";
import { useAuth } from "./useAuth";

export function useMenuBuilder() {
    const { userRole, user, logout } = useAuth();
    const supabase = createClient(); // Initialize Supabase browser client

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | string>("all");
    const restaurantsFetchedRef = useRef(false);

    // --- 1. FETCH RESTAURANTS ---
    const fetchRestaurants = useCallback(async () => {
        try {
            if (!user) {
                setLoading(false);
                return;
            }

            // Reset fetch ref if called manually (e.g., after save)
            // If you want to allow manual refreshes, you can remove the ref check here
            // or pass a 'force' boolean.

            let query = supabase
                .from("restaurants")
                .select("*")
                .order("created_at", { ascending: false });

            // RBAC: If user is not admin, only show restaurants they own
            if (userRole !== "admin") {
                query = query.eq("owner_id", user.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching restaurants:", error);
            } else {
                setRestaurants(data || []);
            }
        } catch (error) {
            console.error("Unexpected error fetching restaurants:", error);
        } finally {
            setLoading(false);
        }
    }, [user, userRole, supabase]);

    // Initial load
    useEffect(() => {
        if (user && userRole !== null && !restaurantsFetchedRef.current) {
            restaurantsFetchedRef.current = true;
            fetchRestaurants();
        }
    }, [user, userRole, fetchRestaurants]);

    // --- 2. SELECT RESTAURANT & LOAD DATA ---
    const selectRestaurant = useCallback(async (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setSearchTerm("");
        setActiveFilter("all");

        try {
            // Load Categories (Using direct Supabase call for better consistency)
            const { data: catData, error: catError } = await supabase
                .from("menu_categories")
                .select("*")
                .eq("restaurant_id", restaurant.id)
                .order("order", { ascending: true });

            if (!catError) setCategories(catData || []);

            // Load Menu Items
            const { data: itemData, error: itemError } = await supabase
                .from("menu_items")
                .select("*")
                .eq("restaurant_id", restaurant.id)
                .order("order", { ascending: true });

            if (!itemError) setItems(itemData || []);

        } catch (error) {
            console.error("Error loading restaurant data:", error);
        }
    }, [supabase]);

    // --- 3. ACTIONS (CRUD) ---

    const deleteItemAction = async (id: string) => {
        const { error } = await supabase
            .from("menu_items")
            .delete()
            .eq("id", id);

        if (!error) {
            setItems((prev) => prev.filter((item) => item.id !== id));
            return { success: true };
        }
        return { success: false, error };
    };

    const deleteCategoryAction = async (id: string) => {
        const { error } = await supabase
            .from("menu_categories")
            .delete()
            .eq("id", id);

        if (!error) {
            setCategories((prev) => prev.filter((c) => c.id !== id));
            if (activeFilter === id) setActiveFilter("all");
            return { success: true };
        }
        return { success: false, error };
    };

    const moveItem = (index: number, direction: "up" | "down") => {
        const newItems = [...items];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setItems(newItems);
        // Note: You should eventually add a Supabase .update() call here to persist the order
    };

    // --- 4. MEMOIZED FILTERING ---
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
        logout,
    };
}