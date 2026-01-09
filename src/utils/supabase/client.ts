import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components ("use client").
 * This client automatically handles authentication and cookie persistence.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}