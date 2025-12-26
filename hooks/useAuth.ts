'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function useAuth() {
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const router = useRouter()

    const login = async (email: string, password: string) => {
        setLoading(true)
        setErrorMsg(null)

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setErrorMsg(error.message)
                return { success: false }
            }

            // Success: Redirect to dashboard
            router.push('/dashboard/menu-builder')
            return { success: true }
        } catch (err) {
            setErrorMsg('An unexpected error occurred. Please try again.')
            return { success: false }
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        await supabaseClient.auth.signOut()
        router.push('/login')
    }

    return {
        login,
        logout,
        loading,
        errorMsg,
    }
}