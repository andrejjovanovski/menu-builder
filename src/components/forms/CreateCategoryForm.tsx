'use client'

import { useState } from 'react'
import { generateSlug } from '@/src/utils/slug'
import { Restaurant, MenuCategory } from '@/src/types'

interface CreateCategoryFormProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onCreate: (cat: MenuCategory) => void
}

export function CreateCategoryForm({ categories, selectedRestaurant, onCreate }: CreateCategoryFormProps) {
    const [name, setName] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim() && selectedRestaurant) {
            const slug = generateSlug(name.trim())
            try {
                const response = await fetch(`/api/restaurants/${selectedRestaurant.slug}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), slug, order: categories.length + 1 }),
                })
                if (response.ok) {
                    const data = await response.json()
                    onCreate(data)
                    setName('')
                }
            } catch (error) {
                console.error('Error creating category:', error)
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">New Category Name</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Starters, Main, Drinks..."
                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                    <button type="submit" className="px-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">
                        Add
                    </button>
                </div>
            </div>
        </form>
    )
}