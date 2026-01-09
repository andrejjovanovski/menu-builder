'use client'

import { Modal } from '../ui/Modal'
import { EditItemForm } from '../forms/EditItemForm'
import { MenuItem, MenuCategory, Restaurant } from '@/src/types'

interface EditItemModalProps {
    item: MenuItem | null
    categories: MenuCategory[]
    selectedRestaurant: Restaurant
    onClose: () => void
    onUpdated: (updatedItem: MenuItem) => void
}

export function EditItemModal({ item, categories, selectedRestaurant, onClose, onUpdated }: EditItemModalProps) {
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