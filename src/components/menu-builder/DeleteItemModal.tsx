'use client'

import { Modal } from "../ui/Modal"
import { AlertTriangle, Trash2 } from "lucide-react"

interface DeleteItemModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    itemName: string
    isLoading?: boolean
}

export function DeleteItemModal({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    isLoading
}: DeleteItemModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Menu Item"
            description="This action cannot be undone."
        >
            <div className="flex flex-col items-center text-center">
                {/* Warning Icon */}
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 border border-rose-100">
                    <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>

                <p className="text-slate-900 font-medium text-lg leading-relaxed">
                    Are you sure you want to delete <span className="font-black">"{itemName}"</span>?
                </p>
                <p className="text-slate-500 text-sm mt-2">
                    This will permanently remove the item from your database and your live menu.
                </p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                    <button
                        onClick={onClose}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-2xl transition-all"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete Item
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    )
}