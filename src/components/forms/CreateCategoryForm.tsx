'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { generateSlug } from '@/src/utils/slug'
import { Restaurant, MenuCategory } from '@/src/types'

interface CreateCategoryFormProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onCreate: (cat: MenuCategory) => void
}

export function CreateCategoryForm({ categories, selectedRestaurant, onCreate }: CreateCategoryFormProps) {
    const [name, setName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submitting) return
        if (!name.trim() || !selectedRestaurant) return

        const slug = generateSlug(name.trim())
        setSubmitting(true)
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
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">New Category Name</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Starters, Main, Drinks..."
                        disabled={submitting}
                        className="min-w-0 flex-1 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={submitting || !name.trim()}
                        className="shrink-0 whitespace-nowrap px-4 sm:px-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 inline-flex items-center justify-center gap-2 min-w-[72px] sm:min-w-[88px]"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </button>
                </div>
            </div>
        </form>
    )
}