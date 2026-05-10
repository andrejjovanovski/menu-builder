'use client'

import { X, Edit3, Trash2, Check, XCircle, GripVertical, Image as ImageIcon, Loader2 } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { MenuCategory, Restaurant } from '@/src/types'
import { uploadAsset } from '@/src/utils/uploads'
import { CreateCategoryForm } from '../forms/CreateCategoryForm'

export type CategoryUpdatePatch = {
    name?: string
    image_url?: string | null
    description?: string | null
}

interface CategoryModalProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onClose: () => void
    onDeleteCategory: (id: string) => void
    onCategoryCreated: (cat: MenuCategory) => void
    onCategoryUpdate: (id: string, patch: CategoryUpdatePatch) => Promise<void> | void
    onCategoryReorder: (reorderedCategories: MenuCategory[]) => void
}

export function CategoryModal({
    categories,
    selectedRestaurant,
    onClose,
    onDeleteCategory,
    onCategoryCreated,
    onCategoryUpdate,
    onCategoryReorder
}: CategoryModalProps) {

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleEditClick = (cat: MenuCategory) => {
        setEditingCategoryId(cat.id);
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
    };

    // Drag and Drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const reordered = [...categories];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, draggedItem);

        const updatedCategories = reordered.map((cat, idx) => ({
            ...cat,
            order: idx
        }));

        onCategoryReorder(updatedCategories);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-200">
            <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex shrink-0 items-center justify-between p-6 pb-4 sm:p-8 sm:pb-6">
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Manage Categories</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 sm:px-8 sm:pb-8">
                    <div className="shrink-0">
                        <CreateCategoryForm
                            categories={categories}
                            selectedRestaurant={selectedRestaurant}
                            onCreate={onCategoryCreated}
                        />
                    </div>

                    <div className="mt-8 flex min-h-0 flex-1 flex-col">
                        <p className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Existing Categories</p>
                        <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                            {categories.map((cat, index) => {
                                const isEditing = editingCategoryId === cat.id;
                                return (
                                    <div
                                        key={cat.id}
                                        draggable={!isEditing}
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`rounded-2xl border transition-all ${draggedIndex === index
                                            ? 'opacity-50 border-slate-300'
                                            : dragOverIndex === index
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-slate-100 bg-slate-50'
                                            }`}
                                    >
                                        {isEditing ? (
                                            <CategoryEditor
                                                category={cat}
                                                restaurantId={selectedRestaurant.id}
                                                onSave={async (patch) => {
                                                    await onCategoryUpdate(cat.id, patch);
                                                    setEditingCategoryId(null);
                                                }}
                                                onCancel={handleCancelEdit}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                                                <div className="flex min-w-0 items-center gap-3 flex-grow">
                                                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors">
                                                        <GripVertical className="w-5 h-5" />
                                                    </div>
                                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                                                        {cat.image_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={cat.image_url}
                                                                alt={cat.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                                <ImageIcon className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm sm:text-base font-bold text-slate-700">{cat.name}</p>
                                                        {cat.description && (
                                                            <p className="truncate text-xs text-slate-500">{cat.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleEditClick(cat)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => onDeleteCategory(cat.id)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CategoryEditor({
    category,
    restaurantId,
    onSave,
    onCancel,
}: {
    category: MenuCategory;
    restaurantId: string;
    onSave: (patch: CategoryUpdatePatch) => Promise<void>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(category.name);
    const [description, setDescription] = useState(category.description ?? "");
    const [imageUrl, setImageUrl] = useState<string | null>(category.image_url ?? null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadAsset(file, `restaurant-assets/${restaurantId}/categories`);
            setImageUrl(url);
        } catch (error) {
            console.error("Category image upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await onSave({
                name: name.trim(),
                description: description.trim() ? description.trim() : null,
                image_url: imageUrl,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3 p-4">
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white transition hover:border-indigo-400"
                >
                    {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
                            <ImageIcon className="h-5 w-5" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">Image</span>
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                    )}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handleFile(event.target.files?.[0])}
                />
                <div className="flex-1 space-y-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Category name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional description (one short line)"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
                {imageUrl && (
                    <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        disabled={saving || uploading}
                        className="rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                        Remove image
                    </button>
                )}
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                >
                    <XCircle className="inline h-3.5 w-3.5 mr-1" />
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || uploading || !name.trim()}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="inline h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                        <Check className="inline h-3.5 w-3.5 mr-1" />
                    )}
                    Save
                </button>
            </div>
        </div>
    );
}
