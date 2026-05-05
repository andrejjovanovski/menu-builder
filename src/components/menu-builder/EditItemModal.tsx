'use client'

import { Modal } from '../ui/Modal'
import { EditItemForm } from '../forms/EditItemForm'
import { MenuItem, MenuCategory, Restaurant } from '@/src/types'

interface EditItemModalProps {
    item: MenuItem | null
    categories: MenuCategory[]
    restaurantItems: MenuItem[]
    selectedRestaurant: Restaurant
    onClose: () => void
    onUpdated: (updatedItem: MenuItem) => void
}

export function EditItemModal({ item, categories, restaurantItems, selectedRestaurant, onClose, onUpdated }: EditItemModalProps) {
    if (!item) return null

    return (
        <Modal
            isOpen={!!item}
            onClose={onClose}
            title="Edit Menu Item"
            description={`Modifying ${item.name}`}
        >
            <EditItemForm
                item={item}
                categories={categories}
                restaurantItems={restaurantItems}
                selectedRestaurant={selectedRestaurant}
                onCancel={onClose}
                onUpdate={(updatedItem) => {
                    onUpdated(updatedItem)
                    onClose()
                }}
            />
        </Modal>
    )
}