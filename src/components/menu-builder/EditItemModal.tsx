'use client'

import { Modal } from '../ui/Modal'
import { EditItemForm } from '../forms/EditItemForm'
import { MenuItem, MenuCategory } from '@/src/types'

interface EditItemModalProps {
    item: MenuItem | null
    categories: MenuCategory[]
    onClose: () => void
    onUpdated: (updatedItem: MenuItem) => void
}

export function EditItemModal({ item, categories, onClose, onUpdated }: EditItemModalProps) {
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
                onCancel={onClose}
                onUpdate={(updatedItem) => {
                    onUpdated(updatedItem)
                    onClose()
                }}
            />
        </Modal>
    )
}