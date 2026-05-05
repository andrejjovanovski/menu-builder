'use client'

import { useState } from 'react'
import { DollarSign, ImagePlus, X, Loader2 } from 'lucide-react'
import { Restaurant, MenuCategory, MenuItem } from '@/src/types'
import { uploadAsset } from '@/src/utils/uploads'
import { ALLERGEN_TAGS, DIETARY_TAGS } from '@/src/utils/menuTags'

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
    const [dietaryTags, setDietaryTags] = useState<string[]>([])
    const [allergenTags, setAllergenTags] = useState<string[]>([])

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !price || !categoryId || !selectedRestaurant) return

        setIsUploading(true)

        try {
            let image_url = ''
            if (imageFile) {
                image_url = await uploadAsset(imageFile, `menu-items/${selectedRestaurant.id}`)
            }

            const category = categories.find((c) => c.id === categoryId)
            if (!category) return

            const response = await fetch(`/api/restaurants/${selectedRestaurant.slug}/categories/${category.slug}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    price: parseFloat(price),
                    image_url: image_url || undefined,
                    dietary_tags: dietaryTags,
                    allergen_tags: allergenTags,
                    is_available: true,
                    order: 0,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                onCreate(data)
                // Reset Form
                setName(''); setDescription(''); setPrice(''); setCategoryId('')
                setDietaryTags([]); setAllergenTags([])
                setImageFile(null); setImagePreview(null)
            }
        } catch (error) {
            console.error('Error creating item:', error)
        } finally {
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
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
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

                {/* TEXT DETAILS */}
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
                    <div className="grid grid-cols-2 gap-3">
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
                            <option value="">Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ingredients or description..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm"
                    />

                    <TagSelector
                        title="Dietary Tags"
                        options={DIETARY_TAGS}
                        selected={dietaryTags}
                        onToggle={(value) =>
                            setDietaryTags((prev) =>
                                prev.includes(value) ? prev.filter((tag) => tag !== value) : [...prev, value]
                            )
                        }
                    />

                    <TagSelector
                        title="Allergens"
                        options={ALLERGEN_TAGS}
                        selected={allergenTags}
                        onToggle={(value) =>
                            setAllergenTags((prev) =>
                                prev.includes(value) ? prev.filter((tag) => tag !== value) : [...prev, value]
                            )
                        }
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isUploading}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
            >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add to Menu'}
            </button>
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
