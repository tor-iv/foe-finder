import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/questionnaire',
  '/record-intro',
  '/results',
  '/profile',
  '/admin',
];

// Routes that require email verification (subset of protected)
const EMAIL_VERIFIED_ROUTES = ['/questionnaire', '/record-intro'];

// Routes that require admin role
const ADMIN_ROUTES = ['/admin'];

// Public routes (no auth required)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with cookie handling for token refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session - THIS TRIGGERS TOKEN REFRESH
  // Using an async IIFE since proxy must return synchronously in Next.js 16
  // However, Next.js 16 proxy supports async - let's use the async pattern
  return handleAuth(request, response, supabase, pathname);
}

async function handleAuth(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createServerClient>,
  pathname: string
) {
  // Get user session - THIS TRIGGERS TOKEN REFRESH
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check route types
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const requiresEmailVerification = EMAIL_VERIFIED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Home page: redirect to login if not authenticated
  if (pathname === '/' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Protected route without auth: redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Email verification required
  if (requiresEmailVerification && user && !user.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'verify-email');
    return NextResponse.redirect(url);
  }

  // Admin route: verify admin role
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return NextResponse.redirect(url);
    }
  }

  // Logged in user on public route: redirect to home
  if (isPublicRoute && user && pathname !== '/auth/callback') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
