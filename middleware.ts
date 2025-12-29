import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // 1. SUPABASE AUTH LOGIC
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 2. DASHBOARD PROTECTION
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. HIDDEN LOCALIZATION LOGIC
  // Detect cookie, default to 'en'
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en'

  // Pass the locale to the app via a custom header
  response.headers.set('x-next-intl-locale', locale)

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}