'use client'

import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 4000) // Auto-close after 4 seconds
        return () => clearTimeout(timer)
    }, [onClose])

    const styles = {
        success: "bg-emerald-600 shadow-emerald-200",
        error: "bg-rose-600 shadow-rose-200"
    }

    return (
        <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-[24px] text-white shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 ${styles[type]}`}>
            {type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            ) : (
                <AlertCircle className="w-5 h-5 text-rose-100" />
            )}
            <span className="font-bold text-sm tracking-tight">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}