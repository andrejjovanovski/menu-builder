'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { generateSlug } from '@/src/utils/slug'

interface CreateRestaurantFormProps {
    onCreate: () => void
    className?: string
}

export function CreateRestaurantForm({ onCreate, className }: CreateRestaurantFormProps) {
    const [name, setName] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        const slug = generateSlug(name)
        try {
            const response = await fetch('/api/restaurants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug }),
            })
            if (response.ok) {
                setName('')
                onCreate()
            }
        } catch (error) {
            console.error('Error creating restaurant:', error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New venue name..."
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <Plus className="w-4 h-4" />
            </button>
        </form>
    )
}