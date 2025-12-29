import { Plus, UtensilsCrossed } from 'lucide-react'
import { Restaurant } from '@/src/types'
import { CreateRestaurantForm } from '../forms/CreateRestaurantForm'
import { UserRole } from '@/src/types'

interface Props {
    restaurants: Restaurant[]
    selectedId?: string
    onSelect: (r: Restaurant) => void
    onRefresh: () => void
    userRole: UserRole
}

export function MenuSidebar({ restaurants, selectedId, onSelect, onRefresh, userRole }: Props) {
    return (
        <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white"><UtensilsCrossed className="w-5 h-5" /></div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Menu Studio</h2>
                </div>
                <div className="mt-6 w-full">
                    <button
                        className="w-full flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Add Restaurant
                    </button>
                </div>
                {userRole === 'admin' && <CreateRestaurantForm onCreate={onRefresh} className="mt-6" />}
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{userRole === 'admin' ? "All" : "My"} Restaurants</p>
                {restaurants.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => onSelect(r)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedId === r.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <span className="truncate">{r.name}</span>
                        {selectedId === r.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                    </button>
                ))}
            </nav>
        </aside>
    )
}