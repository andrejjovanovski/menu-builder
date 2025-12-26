'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { Restaurant, MenuCategory, MenuItem } from '@/src/types'

export function useMenuBuilder() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
    const [categories, setCategories] = useState<MenuCategory[]>([])
    const [items, setItems] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeFilter, setActiveFilter] = useState<'all' | string>('all')

    const fetchRestaurants = async () => {
        try {
            const response = await fetch('/api/restaurants')
            if (response.ok) {
                const data = await response.json()
                setRestaurants(data)
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRestaurants()
    }, [])

    const selectRestaurant = useCallback(async (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant)
        setSearchTerm('')
        setActiveFilter('all')
        try {
            const catResponse = await fetch(`/api/restaurants/${restaurant.slug}/categories`)
            if (catResponse.ok) {
                const cats = await catResponse.json()
                setCategories(cats)
            }

            const { data } = await supabaseClient
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .order('order', { ascending: true })

            if (data) setItems(data)
        } catch (error) {
            console.error('Error loading restaurant data:', error)
        }
    }, [])

    // Executes the actual deletion in the database
    const deleteItemAction = async (id: string) => {
        const { error } = await supabaseClient.from('menu_items').delete().eq('id', id)
        if (!error) {
            setItems(prev => prev.filter(item => item.id !== id))
            return { success: true }
        }
        return { success: false, error }
    }

    const deleteCategoryAction = async (id: string) => {
        const response = await fetch(`/api/restaurants/${selectedRestaurant?.slug}/categories/${id}`, {
            method: 'DELETE'
        })
        if (response.ok) {
            setCategories(prev => prev.filter(c => c.id !== id))
            if (activeFilter === id) setActiveFilter('all')
            return { success: true }
        }
        return { success: false }
    }

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...items]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= newItems.length) return
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
        setItems(newItems)
    }

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = activeFilter === 'all' || item.category_id === activeFilter
            return matchesSearch && matchesCategory
        })
    }, [items, searchTerm, activeFilter])

    return {
        restaurants, selectedRestaurant, categories, items, loading,
        searchTerm, setSearchTerm, activeFilter, setActiveFilter,
        filteredItems, fetchRestaurants, selectRestaurant,
        deleteItemAction, deleteCategoryAction, moveItem, setItems, setCategories
    }
}