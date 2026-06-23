import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/buyer', '/seller', '/driver', '/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isProtected) {
    const hasRefreshToken = request.cookies.has('seapedia_refresh_token')
    if (!hasRefreshToken) {
      const loginUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/buyer/:path*', '/seller/:path*', '/driver/:path*', '/admin/:path*'],
}
