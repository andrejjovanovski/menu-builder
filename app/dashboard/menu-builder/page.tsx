"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { FolderTree, Plus, Search, UtensilsCrossed } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/src/components/dashboard/DashboardShell";
import { CategoryModal } from "@/src/components/menu-builder/CategoryModal";
import { DeleteItemModal } from "@/src/components/menu-builder/DeleteItemModal";
import { EditItemModal } from "@/src/components/menu-builder/EditItemModal";
import { ItemCard } from "@/src/components/menu-builder/ItemCard";
import { ItemModal } from "@/src/components/menu-builder/ItemModal";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Toast, ToastType } from "@/src/components/ui/Toast";
import { MenuCategory, MenuItem, Restaurant } from "@/src/types";

export default function MenuBuilderPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | string>("all");
  const [loadingMenu, setLoadingMenu] = useState(false);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeFilter === "all" || item.category_id === activeFilter;
      return matchesSearch && matchesCategory;
    });
  }, [activeFilter, items, searchTerm]);

  return (
    <DashboardShell section="menu-builder">
      {({ selectedRestaurant }) => (
        <MenuBuilderContent
          activeFilter={activeFilter}
          categories={categories}
          editingItem={editingItem}
          filteredItems={filteredItems}
          isCatModalOpen={isCatModalOpen}
          isDeleting={isDeleting}
          isItemModalOpen={isItemModalOpen}
          itemToDelete={itemToDelete}
          loadingMenu={loadingMenu}
          searchTerm={searchTerm}
          selectedRestaurant={selectedRestaurant!}
          setActiveFilter={setActiveFilter}
          setCategories={setCategories}
          setEditingItem={setEditingItem}
          setIsCatModalOpen={setIsCatModalOpen}
          setIsDeleting={setIsDeleting}
          setIsItemModalOpen={setIsItemModalOpen}
          setItemToDelete={setItemToDelete}
          setItems={setItems}
          setLoadingMenu={setLoadingMenu}
          setSearchTerm={setSearchTerm}
          setToast={setToast}
          showToast={showToast}
          toast={toast}
        />
      )}
    </DashboardShell>
  );
}

function MenuBuilderContent({
  activeFilter,
  categories,
  editingItem,
  filteredItems,
  isCatModalOpen,
  isDeleting,
  isItemModalOpen,
  itemToDelete,
  loadingMenu,
  searchTerm,
  selectedRestaurant,
  setActiveFilter,
  setCategories,
  setEditingItem,
  setIsCatModalOpen,
  setIsDeleting,
  setIsItemModalOpen,
  setItemToDelete,
  setItems,
  setLoadingMenu,
  setSearchTerm,
  setToast,
  showToast,
  toast,
}: {
  activeFilter: "all" | string;
  categories: MenuCategory[];
  editingItem: MenuItem | null;
  filteredItems: MenuItem[];
  isCatModalOpen: boolean;
  isDeleting: boolean;
  isItemModalOpen: boolean;
  itemToDelete: MenuItem | null;
  loadingMenu: boolean;
  searchTerm: string;
  selectedRestaurant: Restaurant;
  setActiveFilter: Dispatch<SetStateAction<"all" | string>>;
  setCategories: Dispatch<SetStateAction<MenuCategory[]>>;
  setEditingItem: Dispatch<SetStateAction<MenuItem | null>>;
  setIsCatModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsDeleting: Dispatch<SetStateAction<boolean>>;
  setIsItemModalOpen: Dispatch<SetStateAction<boolean>>;
  setItemToDelete: Dispatch<SetStateAction<MenuItem | null>>;
  setItems: Dispatch<SetStateAction<MenuItem[]>>;
  setLoadingMenu: Dispatch<SetStateAction<boolean>>;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setToast: Dispatch<SetStateAction<{ message: string; type: ToastType } | null>>;
  showToast: (message: string, type?: ToastType) => void;
  toast: { message: string; type: ToastType } | null;
}) {
  useEffect(() => {
    async function loadMenuData() {
      setLoadingMenu(true);
      setSearchTerm("");
      setActiveFilter("all");

      try {
        const categoryData = await apiFetch<MenuCategory[]>(
          `/api/restaurants/${selectedRestaurant.slug}/categories`
        );

        setCategories(categoryData || []);

        const itemResponses = await Promise.all(
          (categoryData || []).map((category) =>
            apiFetch<MenuItem[]>(
              `/api/restaurants/${selectedRestaurant.slug}/categories/${category.slug}/items`
            )
          )
        );

        setItems(itemResponses.flat());
      } catch (error) {
        console.error("Error loading menu data:", error);
        setCategories([]);
        setItems([]);
      } finally {
        setLoadingMenu(false);
      }
    }

    void loadMenuData();
  }, [selectedRestaurant, setActiveFilter, setCategories, setItems, setLoadingMenu, setSearchTerm]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiFetch(`/api/items/${itemToDelete.id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== itemToDelete.id));
      showToast(`"${itemToDelete.name}" removed from menu`);
    } catch (error) {
      console.error("Could not delete item", error);
      showToast("Could not delete item", "error");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleCategoryUpdate = async (id: string, name: string) => {
    try {
      await apiFetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      setCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, name: name.trim() } : category
        )
      );
      showToast("Category updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
      showToast("Failed to update category", "error");
    }
  };

  const handleCategoryReorder = async (reorderedCategories: MenuCategory[]) => {
    try {
      await apiFetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: reorderedCategories }),
      });

      setCategories(reorderedCategories);
      showToast("Categories reordered successfully!");
    } catch (error) {
      console.error("Error reordering categories:", error);
      showToast("Failed to reorder categories", "error");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div>
              <a
                href={`${window.location.origin}/${selectedRestaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl font-semibold tracking-tight"
              >
                {selectedRestaurant.name}
              </a>
              <CardDescription className="mt-2">
                Build categories and dishes for the public menu.
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search menu..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsCatModalOpen(true)}
              >
                <FolderTree className="h-4 w-4" />
                Categories
              </Button>
              <Button
                onClick={() => setIsItemModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
          </CardHeader>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveFilter("all")}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              activeFilter === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-accent"
            }`}
          >
            All Dishes
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveFilter(category.id)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                activeFilter === category.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Menu Items
              </CardTitle>
              <CardDescription>
                Review and edit the dishes that will appear publicly.
              </CardDescription>
            </div>
            <Badge variant="secondary">{filteredItems.length} visible</Badge>
          </CardHeader>
          <CardContent>
            {loadingMenu ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
                Loading menu items...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    index={index}
                    item={item}
                    categoryName={
                      categories.find((category) => category.id === item.category_id)
                        ?.name
                    }
                    onDelete={() => setItemToDelete(item)}
                    onEdit={() => setEditingItem(item)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    No items found
                  </p>
                </div>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {isCatModalOpen && (
        <CategoryModal
          categories={categories}
          selectedRestaurant={selectedRestaurant}
          onClose={() => setIsCatModalOpen(false)}
          onDeleteCategory={async (id) => {
            try {
              await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
              setCategories((current) =>
                current.filter((category) => category.id !== id)
              );
              setItems((current) =>
                current.filter((item) => item.category_id !== id)
              );
              if (activeFilter === id) {
                setActiveFilter("all");
              }
              showToast("Category deleted");
              return { success: true };
            } catch (error) {
              console.error("Failed to delete category", error);
              showToast("Failed to delete category", "error");
              return { success: false };
            }
          }}
          onCategoryCreated={(category) => {
            setCategories((current) => [...current, category]);
            showToast(`Category "${category.name}" added`);
          }}
          onCategoryUpdate={handleCategoryUpdate}
          onCategoryReorder={handleCategoryReorder}
        />
      )}

      {isItemModalOpen && (
        <ItemModal
          categories={categories}
          selectedRestaurant={selectedRestaurant}
          onClose={() => setIsItemModalOpen(false)}
          onItemCreated={(item) => {
            setItems((current) => [...current, item]);
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

      {editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories}
          selectedRestaurant={selectedRestaurant}
          onClose={() => setEditingItem(null)}
          onUpdated={(updatedItem) => {
            setItems((current) =>
              current.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              )
            );
            showToast(`"${updatedItem.name}" updated successfully`);
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
