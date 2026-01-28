
'use client'

import { X, Edit3, Trash2, Check, XCircle, GripVertical } from 'lucide-react'
import React, { useState } from 'react'
import { MenuCategory, Restaurant } from '@/src/types'
import { CreateCategoryForm } from '../forms/CreateCategoryForm'

interface CategoryModalProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onClose: () => void
    onDeleteCategory: (id: string) => void
    onCategoryCreated: (cat: MenuCategory) => void
    onCategoryUpdate: (id: string, name: string) => void
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
    const [editedCategoryName, setEditedCategoryName] = useState<string>('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleEditClick = (cat: MenuCategory) => {
        setEditingCategoryId(cat.id);
        setEditedCategoryName(cat.name);
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setEditedCategoryName('');
    };

    const handleSaveEdit = () => {
        if (editingCategoryId && editedCategoryName.trim()) {
            onCategoryUpdate(editingCategoryId, editedCategoryName.trim());
            setEditingCategoryId(null);
            setEditedCategoryName('');
        } else if (editingCategoryId) {
            handleCancelEdit();
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedCategoryName(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
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

        // Update order values
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
                        {categories.map((cat, index) => (
                            <div
                                key={cat.id}
                                draggable={editingCategoryId !== cat.id}
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl border transition-all ${draggedIndex === index
                                        ? 'opacity-50 border-slate-300'
                                        : dragOverIndex === index
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-100'
                                    } group`}
                            >
                                {editingCategoryId === cat.id ? (
                                    // Input field for editing
                                    <>
                                        <input
                                            type="text"
                                            value={editedCategoryName}
                                            onChange={handleNameChange}
                                            onKeyDown={handleKeyDown}
                                            className="flex-grow p-2 mr-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-1">
                                            <button onClick={handleSaveEdit} className="p-2 hover:bg-white rounded-xl text-green-600 hover:text-green-800 transition-colors">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={handleCancelEdit} className="p-2 hover:bg-white rounded-xl text-red-400 hover:text-red-600 transition-colors">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // Display category name and edit/delete buttons
                                    <>
                                        <div className="flex items-center gap-3 flex-grow">
                                            <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors">
                                                <GripVertical className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-slate-700">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEditClick(cat)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onDeleteCategory(cat.id)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
