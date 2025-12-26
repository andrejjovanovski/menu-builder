'use client'

import { X, UtensilsCrossed } from 'lucide-react'
import { Restaurant, MenuCategory, MenuItem } from '@/src/types'
import { CreateItemForm } from '../forms/CreateItemForm'

interface ItemModalProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onClose: () => void
    onItemCreated: (item: MenuItem) => void
}

export function ItemModal({ categories, selectedRestaurant, onClose, onItemCreated }: ItemModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-300">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <UtensilsCrossed className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add New Item</h3>
                                <p className="text-slate-500 text-sm font-medium">Add a dish to {selectedRestaurant.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <CreateItemForm
                        categories={categories}
                        selectedRestaurant={selectedRestaurant}
                        onCreate={(item) => {
                            onItemCreated(item);
                            onClose();
                        }}
                    />
                </div>
            </div>
        </div>
    )
}