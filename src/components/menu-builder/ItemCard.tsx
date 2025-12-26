import { ArrowUp, ArrowDown, Edit3, Trash2 } from 'lucide-react'
import { MenuItem } from '@/src/types'

interface Props {
    item: MenuItem
    categoryName?: string
    onMove: (direction: 'up' | 'down') => void
    onDelete: (id: string) => void
    onEdit: (item: MenuItem) => void
}

export function ItemCard({ item, categoryName, onMove, onDelete, onEdit }: Props) {
    return (
        <div className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg hover:shadow-indigo-500/5">
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onMove('up')} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ArrowUp className="w-3 h-3" /></button>
                <button onClick={() => onMove('down')} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ArrowDown className="w-3 h-3" /></button>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-500 uppercase tracking-tighter">
                        {categoryName || 'Uncategorized'}
                    </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
            </div>
            <div className="text-right flex items-center gap-4">
                <span className="font-black text-slate-900 text-lg">${item.price}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(item.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    )
}