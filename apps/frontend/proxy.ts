import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Route protection intentionally lives client-side (hooks/useRequireRole.ts), not here.
 *
 * The refresh-token cookie is set with `Path=/api/auth` (see SRS.md 5.4) so the browser
 * never attaches it to requests outside that path — including /buyer/*, /admin/* etc.
 * A middleware check on `request.cookies` against those routes can therefore never see
 * the cookie and would always redirect, even immediately after a successful login.
 *
 * useRequireRole() reads the Zustand auth store (populated from the access token) and
 * redirects client-side instead. Backend endpoints re-validate active_role from the JWT
 * regardless, so this isn't a security regression — just removing a check that could
 * never have worked given the cookie's scope.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/buyer/:path*', '/seller/:path*', '/driver/:path*', '/admin/:path*'],
}
