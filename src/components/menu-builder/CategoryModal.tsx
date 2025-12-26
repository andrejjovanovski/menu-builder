'use client'

import { X, Edit3, Trash2 } from 'lucide-react'
import { MenuCategory, Restaurant } from '@/src/types'
import { CreateCategoryForm } from '../forms/CreateCategoryForm'

interface CategoryModalProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onClose: () => void
    onDeleteCategory: (id: string) => void
    onCategoryCreated: (cat: MenuCategory) => void
}

export function CategoryModal({
    categories,
    selectedRestaurant,
    onClose,
    onDeleteCategory,
    onCategoryCreated
}: CategoryModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-200">
            <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Manage Categories</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <CreateCategoryForm
                    categories={categories}
                    selectedRestaurant={selectedRestaurant}
                    onCreate={onCategoryCreated}
                />

                <div className="mt-8 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Existing Categories</p>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                <span className="font-bold text-slate-700">{cat.name}</span>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => onDeleteCategory(cat.id)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}