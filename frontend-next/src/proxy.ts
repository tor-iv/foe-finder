import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/questionnaire', '/record-intro', '/results', '/profile', '/admin'];
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback'];

// Supabase auth cookie names
const AUTH_COOKIE_PATTERN = /^sb-.*-auth-token/;

function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(c => AUTH_COOKIE_PATTERN.test(c.name));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = hasAuthCookie(request);

  const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r));

  // No cookie + protected route → login
  if ((isProtectedRoute || pathname === '/') && !hasAuth) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/') url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Has cookie + public route → home
  if (isPublicRoute && hasAuth && pathname !== '/auth/callback') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)'],
};
