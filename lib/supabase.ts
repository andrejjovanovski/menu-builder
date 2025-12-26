import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'

const cookieStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === key) return decodeURIComponent(value)
    }
    return null
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; secure; samesite=lax`
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

// Server-side Supabase client with service role for admin operations (writes)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Server-side Supabase client with anon key for public reads
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Client-side Supabase client with anon key for public operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
})