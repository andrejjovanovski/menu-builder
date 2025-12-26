'use client'

import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { Restaurant, MenuCategory, MenuItem } from '@/src/types'

interface CreateItemFormProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onCreate: (item: MenuItem) => void
}

export function CreateItemForm({ categories, selectedRestaurant, onCreate }: CreateItemFormProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [categoryId, setCategoryId] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim() && price && categoryId && selectedRestaurant) {
            const category = categories.find((c) => c.id === categoryId)
            if (!category) return

            try {
                const response = await fetch(`/api/restaurants/${selectedRestaurant.slug}/categories/${category.slug}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim() || undefined,
                        price: parseFloat(price),
                        is_available: true,
                        order: 0,
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    onCreate(data)
                    setName('')
                    setDescription('')
                    setPrice('')
                    setCategoryId('')
                }
            } catch (error) {
                console.error('Error creating item:', error)
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase ml-1 tracking-widest">Item Details</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dish Name"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                />
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        required
                    />
                </div>
                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700"
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ingredients or description..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-sm"
                />
            </div>
            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                Add to Menu
            </button>
        </form>
    )
}