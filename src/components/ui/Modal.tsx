'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
    // Prevent scrolling on the body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 1. High Contrast Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* 2. Modal Container */}
            <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">

                {/* Header Section */}
                <div className="p-8 pb-0 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-slate-600 text-sm font-medium mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 3. Content Area */}
                <div className="p-8 pt-6">
                    {children}
                </div>
            </div>
        </div>
    )
}