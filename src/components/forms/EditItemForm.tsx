'use client'

import { useEffect, useRef, useState } from 'react'
import { DollarSign, Save, Loader2, ImagePlus, Link2, Plus, Search, X } from 'lucide-react'
import { Restaurant, MenuCategory, MenuItem, UpsellItem } from '@/src/types'
import { uploadAsset } from '@/src/utils/uploads'
import { ALLERGEN_TAGS, DIETARY_TAGS } from '@/src/utils/menuTags'

interface EditItemFormProps {
    item: MenuItem
    categories: MenuCategory[]
    restaurantItems: MenuItem[]
    selectedRestaurant: Restaurant
    onUpdate: (updatedItem: MenuItem) => void
    onCancel: () => void
}

export function EditItemForm({ item, categories, restaurantItems, selectedRestaurant, onUpdate, onCancel }: EditItemFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category_id: item.category_id,
        is_available: item.is_available,
        is_best_seller: item.is_best_seller ?? false,
        is_new: item.is_new ?? false,
        dietary_tags: item.dietary_tags || [],
        allergen_tags: item.allergen_tags || [],
    })

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(item.image_url || null)
    const [isUploading, setIsUploading] = useState(false)

    // Upsell state
    const [upsells, setUpsells] = useState<UpsellItem[]>([])
    const [upsellSearch, setUpsellSearch] = useState('')
    const [upsellDropdownOpen, setUpsellDropdownOpen] = useState(false)
    const [upsellLoading, setUpsellLoading] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function loadUpsells() {
            try {
                const res = await fetch(
                    `/api/restaurants/${selectedRestaurant.slug}/items/${item.id}/upsells`
                )
                if (!res.ok) return
                const data: UpsellItem[] = await res.json()
                // Only show manual upsells in the editor
                setUpsells(data.filter((u) => u.source === 'manual'))
            } catch {
                // ignore
            }
        }
        void loadUpsells()
    }, [item.id, selectedRestaurant.slug])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setUpsellDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const upsellIds = new Set(upsells.map((u) => u.id))
    const filteredItems = restaurantItems.filter(
        (i) =>
            i.id !== item.id &&
            !upsellIds.has(i.id) &&
            i.name.toLowerCase().includes(upsellSearch.toLowerCase())
    )

    const handleAddUpsell = async (candidate: MenuItem) => {
        if (upsells.length >= 3) return
        setUpsellLoading(true)
        setUpsellDropdownOpen(false)
        setUpsellSearch('')
        try {
            const res = await fetch(
                `/api/restaurants/${selectedRestaurant.slug}/items/${item.id}/upsells`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suggested_id: candidate.id, position: upsells.length }),
                }
            )
            if (!res.ok) return
            setUpsells((prev) => [
                ...prev,
                {
                    id: candidate.id,
                    name: candidate.name,
                    price: candidate.price,
                    image_url: candidate.image_url,
                    description: candidate.description,
                    is_available: candidate.is_available,
                    source: 'manual',
                },
            ])
        } catch {
            // ignore
        } finally {
            setUpsellLoading(false)
        }
    }

    const handleRemoveUpsell = async (suggestedId: string) => {
        try {
            await fetch(
                `/api/restaurants/${selectedRestaurant.slug}/items/${item.id}/upsells`,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suggested_id: suggestedId }),
                }
            )
            setUpsells((prev) => prev.filter((u) => u.id !== suggestedId))
        } catch {
            // ignore
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setIsUploading(true)

        try {
            let image_url = item.image_url || ''
            
            // Handle image upload
            if (imageFile) {
                image_url = await uploadAsset(imageFile, `menu-items/${selectedRestaurant.id}`)
            } else if (imagePreview === null && item.image_url) {
                // Image was removed
                image_url = ''
            }

            const response = await fetch(`/api/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category_id: formData.category_id,
                    is_available: formData.is_available,
                    is_best_seller: formData.is_best_seller,
                    is_new: formData.is_new,
                    image_url: image_url || null,
                    dietary_tags: formData.dietary_tags,
                    allergen_tags: formData.allergen_tags,
                }),
            })

            if (!response.ok) throw new Error('Failed to update item')

            const data = await response.json()
            onUpdate(data)
        } catch (error) {
            console.error('Error updating item:', error)
            alert('Failed to update item')
        } finally {
            setLoading(false)
            setIsUploading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* IMAGE UPLOAD SECTION */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Dish Photo</label>
                    <div className="relative group">
                        {imagePreview ? (
                            <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-slate-200">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-1.5 bg-slate-900/50 text-white rounded-full backdrop-blur-sm hover:bg-slate-900"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-500 font-medium">Click to upload photo</p>
                                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">JPG, PNG up to 5MB</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Name Input */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Item Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Price Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Price</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                required
                            />
                        </div>
                    </div>

                    {/* Category Dropdown */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Category</label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none"
                            required
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium min-h-[100px]"
                        placeholder="Describe this dish..."
                    />
                </div>

                <TagSelector
                    title="Dietary Tags"
                    options={DIETARY_TAGS}
                    selected={formData.dietary_tags}
                    onToggle={(value) =>
                        setFormData({
                            ...formData,
                            dietary_tags: formData.dietary_tags.includes(value)
                                ? formData.dietary_tags.filter((tag) => tag !== value)
                                : [...formData.dietary_tags, value],
                        })
                    }
                />

                <TagSelector
                    title="Allergens"
                    options={ALLERGEN_TAGS}
                    selected={formData.allergen_tags}
                    onToggle={(value) =>
                        setFormData({
                            ...formData,
                            allergen_tags: formData.allergen_tags.includes(value)
                                ? formData.allergen_tags.filter((tag) => tag !== value)
                                : [...formData.allergen_tags, value],
                        })
                    }
                />

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="font-bold text-slate-700">Available for customers</span>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_available ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_available ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Smart Highlights */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Highlights</label>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div>
                            <span className="font-bold text-slate-700">⭐ Best Seller</span>
                            <p className="text-xs text-slate-500 mt-0.5">Manually mark this item as a best seller.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_best_seller: !formData.is_best_seller })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_best_seller ? 'bg-amber-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_best_seller ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div>
                            <span className="font-bold text-slate-700">✨ New</span>
                            <p className="text-xs text-slate-500 mt-0.5">Highlight this as a new addition to the menu.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_new: !formData.is_new })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_new ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_new ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                    {item.is_trending && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-2xl border border-orange-200">
                            <span className="text-sm font-bold text-orange-700">🔥 Trending</span>
                            <span className="text-xs text-orange-500">(auto-calculated from views — read only)</span>
                        </div>
                    )}
                </div>

                {/* Upsell Suggestions */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">
                        Suggest with this item <span className="normal-case font-normal text-slate-400">({upsells.length}/3)</span>
                    </label>

                    {upsells.length > 0 && (
                        <div className="space-y-2">
                            {upsells.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between gap-3 px-4 py-3 bg-indigo-50 rounded-2xl border border-indigo-100"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Link2 className="w-4 h-4 shrink-0 text-indigo-400" />
                                        <span className="text-sm font-semibold text-slate-800 truncate">{u.name}</span>
                                        <span className="text-xs text-slate-500 shrink-0">{Number(u.price).toFixed(0)} ден.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleRemoveUpsell(u.id)}
                                        className="shrink-0 p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {upsells.length < 3 && (
                        <div ref={searchRef} className="relative">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    value={upsellSearch}
                                    onChange={(e) => {
                                        setUpsellSearch(e.target.value)
                                        setUpsellDropdownOpen(true)
                                    }}
                                    onFocus={() => setUpsellDropdownOpen(true)}
                                    placeholder="Search items to suggest..."
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                />
                                {upsellLoading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
                            </div>

                            {upsellDropdownOpen && filteredItems.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                    {filteredItems.slice(0, 8).map((candidate) => (
                                        <button
                                            key={candidate.id}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => void handleAddUpsell(candidate)}
                                            className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors"
                                        >
                                            <span className="text-sm font-semibold text-slate-800 truncate">{candidate.name}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-slate-500">{Number(candidate.price).toFixed(0)} ден.</span>
                                                <Plus className="w-4 h-4 text-indigo-500" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-slate-400 ml-1">
                        {upsells.length === 0
                            ? 'No suggestions set — we\'ll auto-suggest similar items to customers.'
                            : 'These items will appear in "You might also like" when customers view this dish.'}
                    </p>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || isUploading}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                    {loading || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                </button>
            </div>
        </form>
    )
}

function TagSelector({
    title,
    options,
    selected,
    onToggle,
}: {
    title: string
    options: ReadonlyArray<{ value: string; label: string }>
    selected: string[]
    onToggle: (value: string) => void
}) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">{title}</label>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const active = selected.includes(option.value)
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onToggle(option.value)}
                            className={`px-3 py-2 rounded-full text-xs font-bold border transition-all ${
                                active
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                        >
                            {option.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
