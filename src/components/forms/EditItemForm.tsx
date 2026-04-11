'use client'

import { useState } from 'react'
import { DollarSign, Save, Loader2, ImagePlus, X } from 'lucide-react'
import { Restaurant, MenuCategory, MenuItem } from '@/src/types'
import { uploadAsset } from '@/src/utils/uploads'
import { ALLERGEN_TAGS, DIETARY_TAGS } from '@/src/utils/menuTags'

interface EditItemFormProps {
    item: MenuItem
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onUpdate: (updatedItem: MenuItem) => void
    onCancel: () => void
}

export function EditItemForm({ item, categories, selectedRestaurant, onUpdate, onCancel }: EditItemFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category_id: item.category_id,
        is_available: item.is_available,
        dietary_tags: item.dietary_tags || [],
        allergen_tags: item.allergen_tags || [],
    })

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(item.image_url || null)
    const [isUploading, setIsUploading] = useState(false)

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
