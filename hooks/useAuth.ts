'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { apiFetch } from '@/lib/api'
import { AppUser, UserRole } from '@/src/types'

type MeResponse = {
    user: AppUser | null
    role: UserRole
}

export function useAuth() {
    const router = useRouter()
    const { data: sessionData, isPending } = authClient.useSession()

    const [user, setUser] = useState<AppUser | null>(null)
    const [userRole, setUserRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)
    const [authActionLoading, setAuthActionLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function loadProfile() {
            if (isPending) {
                setLoading(true)
                return
            }

            if (!sessionData?.user) {
                if (!active) return
                setUser(null)
                setUserRole(null)
                setLoading(false)
                return
            }

            try {
                const data = await apiFetch<MeResponse>('/api/me')
                if (!active) return
                setUser(data.user)
                setUserRole(data.role)
            } catch {
                if (!active) return
                setUser(sessionData.user as AppUser)
                setUserRole('owner')
            } finally {
                if (active) setLoading(false)
            }
        }

        void loadProfile()

        return () => {
            active = false
        }
    }, [sessionData, isPending])

    const login = async (email: string, password: string) => {
        setAuthActionLoading(true)
        setErrorMsg(null)

        try {
            const { error } = await authClient.signIn.email({
                email,
                password,
            })

            if (error) {
                setErrorMsg(error.message || 'Failed to sign in')
                return { success: false }
            }

            router.push('/dashboard/menu-builder')
            router.refresh()
            return { success: true }
        } catch {
            setErrorMsg('An unexpected error occurred.')
            return { success: false }
        } finally {
            setAuthActionLoading(false)
        }
    }

    const signUp = async (email: string, password: string) => {
        setAuthActionLoading(true)
        setErrorMsg(null)

        try {
            const { error } = await authClient.signUp.email({
                email,
                password,
                name: email.split('@')[0],
            })

            if (error) {
                setErrorMsg(error.message || 'Failed to create account')
                return { success: false }
            }

            router.push('/onboarding')
            router.refresh()
            return { success: true }
        } catch {
            setErrorMsg('An unexpected error occurred.')
            return { success: false }
        } finally {
            setAuthActionLoading(false)
        }
    }

    const logout = async () => {
        await authClient.signOut()
        setUser(null)
        setUserRole(null)
        router.push('/login')
        router.refresh()
    }

    return {
        user,
        userRole,
        loading,
        authActionLoading,
        errorMsg,
        login,
        signUp,
        logout,
    }
}
