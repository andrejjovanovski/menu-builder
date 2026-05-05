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
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 shadow-emerald-500/10 dark:text-emerald-300",
        error: "border-rose-500/30 bg-rose-500/15 text-rose-700 shadow-rose-500/10 dark:text-rose-300"
    }

    return (
        <div className={`fixed bottom-8 right-8 z-100 flex items-center gap-3 rounded-[24px] border px-6 py-4 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 ${styles[type]}`}>
            {type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
            ) : (
                <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-bold text-sm tracking-tight">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 rounded-full p-1 transition-colors hover:bg-background/60"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
