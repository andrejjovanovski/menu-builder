import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en'
  response.headers.set('x-next-intl-locale', locale)

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
