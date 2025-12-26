'use client'

import { useState } from 'react'
import { useMenuBuilder } from '@/hooks/useMenuBuilder'
import { MenuSidebar } from '@/src/components/menu-builder/MenuSidebar'
import { ItemCard } from '@/src/components/menu-builder/ItemCard'
import { CategoryModal } from '@/src/components/menu-builder/CategoryModal'
import { ItemModal } from '@/src/components/menu-builder/ItemModal'
import { DeleteItemModal } from '@/src/components/menu-builder/DeleteItemModal'
import { Toast, ToastType } from '@/src/components/ui/Toast'
import { Search, List, Store, Loader2, Plus, Utensils } from 'lucide-react'
import { MenuItem } from '@/src/types'

export default function MenuBuilderPage() {
  const {
    restaurants, selectedRestaurant, categories, loading, searchTerm,
    setSearchTerm, activeFilter, setActiveFilter, filteredItems,
    selectRestaurant, fetchRestaurants, deleteItemAction, moveItem,
    setCategories, deleteCategoryAction, setItems
  } = useMenuBuilder()

  // --- Modal States ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null)

  // --- UI Feedback States ---
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
  }

  // --- Interaction Handlers ---
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)

    const result = await deleteItemAction(itemToDelete.id)

    if (result.success) {
      showToast(`"${itemToDelete.name}" removed from menu`)
    } else {
      showToast("Could not delete item", "error")
    }

    setIsDeleting(false)
    setItemToDelete(null)
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900">
      <MenuSidebar
        restaurants={restaurants}
        selectedId={selectedRestaurant?.id}
        onSelect={selectRestaurant}
        onRefresh={fetchRestaurants}
      />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {!selectedRestaurant ? (
          <div className="h-full flex items-center justify-center p-12 text-center">
            <div className="max-w-sm">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 inline-block mb-6">
                <Store className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No Restaurant Selected</h3>
              <p className="text-slate-600 mt-2 font-medium">Choose a venue from the sidebar to begin.</p>
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* STICKY HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm sticky top-0 z-10">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedRestaurant.name}</h1>
                <p className="text-slate-600 font-bold mt-1 uppercase text-[10px] tracking-widest">Menu Management</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400 w-40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsItemModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
                <button
                  onClick={() => setIsCatModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <List className="w-4 h-4 text-indigo-600" /> Categories
                </button>
              </div>
            </header>

            {/* FILTER TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xl'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                All Dishes
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeFilter === cat.id
                      ? 'bg-indigo-600 text-white shadow-xl'
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* ITEM PREVIEW GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 italic uppercase tracking-tighter">
                  <Utensils className="w-6 h-6 text-indigo-500" />
                  Live Preview
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item: MenuItem, idx: number) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      categoryName={categories.find(c => c.id === item.category_id)?.name}
                      onMove={(dir) => moveItem(idx, dir)}
                      onDelete={() => setItemToDelete(item)}
                    />
                  ))
                ) : (
                  <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No items found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL LAYER --- */}

      {isCatModalOpen && selectedRestaurant && (
        <CategoryModal
          categories={categories}
          selectedRestaurant={selectedRestaurant}
          onClose={() => setIsCatModalOpen(false)}
          onDeleteCategory={async (id) => {
            const res = await deleteCategoryAction(id);
            if (res.success) showToast("Category deleted");
          }}
          onCategoryCreated={(cat) => {
            setCategories([...categories, cat]);
            showToast(`Category "${cat.name}" added`);
          }}
        />
      )}

      {isItemModalOpen && selectedRestaurant && (
        <ItemModal
          categories={categories}
          selectedRestaurant={selectedRestaurant}
          onClose={() => setIsItemModalOpen(false)}
          onItemCreated={(item) => {
            setItems((prev) => [...prev, item]);
            showToast(`"${item.name}" added to menu`);
          }}
        />
      )}

      <DeleteItemModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name || ""}
        isLoading={isDeleting}
      />

      {/* --- NOTIFICATION LAYER --- */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}