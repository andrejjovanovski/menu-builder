
'use client'

import { X, Edit3, Trash2, Check, XCircle } from 'lucide-react' // Added Check and XCircle for save/cancel
import React, { useState } from 'react' // Import React and useState
import { MenuCategory, Restaurant } from '@/src/types'
import { CreateCategoryForm } from '../forms/CreateCategoryForm'

interface CategoryModalProps {
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onClose: () => void
    onDeleteCategory: (id: string) => void
    onCategoryCreated: (cat: MenuCategory) => void
    onCategoryUpdate: (id: string, name: string) => void // New prop for updating category
}

export function CategoryModal({
    categories,
    selectedRestaurant,
    onClose,
    onDeleteCategory,
    onCategoryCreated,
    onCategoryUpdate // Destructure the new prop
}: CategoryModalProps) {

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editedCategoryName, setEditedCategoryName] = useState<string>('');

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
            setEditingCategoryId(null); // Exit edit mode
            setEditedCategoryName('');
        } else if (editingCategoryId) {
            // If name is empty, cancel edit.
            handleCancelEdit();
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedCategoryName(e.target.value);
    };

    // Handle Enter key to save, Escape key to cancel
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
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
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                {editingCategoryId === cat.id ? (
                                    // Input field for editing
                                    <>
                                        <input
                                            type="text"
                                            value={editedCategoryName}
                                            onChange={handleNameChange}
                                            onKeyDown={handleKeyDown}
                                            className="flex-grow p-2 mr-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            autoFocus // Automatically focus the input when it appears
                                        />
                                        <div className="flex items-center gap-1">
                                            <button onClick={handleSaveEdit} className="p-2 hover:bg-white rounded-xl text-green-600 hover:text-green-800 transition-colors">
                                                <Check className="w-4 h-4" /> {/* Save icon */}
                                            </button>
                                            <button onClick={handleCancelEdit} className="p-2 hover:bg-white rounded-xl text-red-400 hover:text-red-600 transition-colors">
                                                <XCircle className="w-4 h-4" /> {/* Cancel icon */}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // Display category name and edit/delete buttons
                                    <>
                                        <span className="font-bold text-slate-700">{cat.name}</span>
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
