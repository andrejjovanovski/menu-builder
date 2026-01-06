'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/src/types'


export function useAuth() {
    const [user, setUser] = useState<any>(null)
    const [userRole, setUserRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)
    const [authActionLoading, setAuthActionLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const router = useRouter()
    const profileFetchedRef = useRef<string | null>(null)

    /**
     * Fetches the user's role from the 'profiles' table.
     * This is called automatically when a session is detected.
     */
    const fetchProfile = useCallback(async (userId: string) => {
        // Prevent duplicate fetches for the same user
        if (profileFetchedRef.current === userId) {
            return
        }

        profileFetchedRef.current = userId

        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (error) throw error
            if (data) {
                setUserRole(data.role as UserRole)
            }
        } catch (err) {
            console.error('Error fetching user role:', err)
            // Fallback to 'owner' if profile fetch fails
            setUserRole('owner')
        }
    }, [])

    /**
     * PROACTIVE AUTH LISTENER
     * Listens for login, logout, and token expiration events.
     */
    useEffect(() => {
        let mounted = true;

        const handleAuthState = async (event: string, session: any) => {
            if (!mounted) return;

            if (session?.user) {
                setUser(session.user);
                // ONLY fetch profile if we have a valid user ID
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setUserRole(null);
                profileFetchedRef.current = null; // Reset on logout
            }
            setLoading(false);
        };

        // 1. Get initial session
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            handleAuthState('INITIAL', session);
        });

        // 2. Listen for changes (including refreshes)
        const { data: authListener } = supabaseClient.auth.onAuthStateChange(
            (event, session) => {
                handleAuthState(event, session);
            }
        );

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, [fetchProfile]);

    /**
     * Login Method
     */
    const login = async (email: string, password: string) => {
        setAuthActionLoading(true)
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

            // Redirection is handled by the useEffect listener or manual router push
            router.push('/dashboard/menu-builder')
            return { success: true }
        } catch (err) {
            setErrorMsg('An unexpected error occurred.')
            return { success: false }
        } finally {
            setAuthActionLoading(false)
        }
    }

    /**
     * Logout Method
     */
    const logout = async () => {
        try {
            await supabaseClient.auth.signOut()
            // State cleanup is handled by onAuthStateChange logic
        } catch (err) {
            console.error('Logout error:', err)
        }
    }

    return {
        user,
        userRole,
        loading,
        authActionLoading,
        errorMsg,
        login,
        logout,
    }
}