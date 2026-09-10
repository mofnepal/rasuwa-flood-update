import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { BASE_PATH } from './lib/constants';

const intlMiddleware = createMiddleware(routing);

/**
 * Auth.js writes the session under one of these, depending on whether the
 * request arrived over https.
 */
const SESSION_COOKIES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

/**
 * Routing only:
 *   /api    passes straight through — it serves published records
 *   /og     share cards, addressed by ?lang= rather than a path prefix
 *   /admin  needs a session cookie, and every admin page then calls
 *           `requireRole`, which verifies the session properly and checks the
 *           role. This gate only saves a round trip; it is not the authority.
 *   else    the public site, which always carries a locale prefix
 *
 * `nextUrl.pathname` still carries the basePath here, so it is stripped first.
 */
export default function middleware(request: NextRequest) {
  const raw = request.nextUrl.pathname;
  const pathname = raw.startsWith(BASE_PATH) ? raw.slice(BASE_PATH.length) || '/' : raw;

  // The API and the share-card images are language-agnostic routes.
  if (pathname.startsWith('/api') || pathname.startsWith('/og')) return NextResponse.next();

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname.startsWith('/admin/login')) return NextResponse.next();
    const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
    if (!hasSession) {
      const url = request.nextUrl.clone();
      // Next re-applies the basePath on redirect, so it is not repeated here.
      url.pathname = '/admin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/((?!_next|_vercel|uploads|favicon.ico|.*\\..*).*)'],
};
