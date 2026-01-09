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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route is protected
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

  // Redirect logic
  if (isProtectedRoute && !user) {
    // Not logged in, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (requiresEmailVerification && user && !user.email_confirmed_at) {
    // Email not verified, redirect to login with message
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'verify-email');
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && user) {
    // Check admin status from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      // Not admin, redirect to profile
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return NextResponse.redirect(url);
    }
  }

  // If logged in user tries to access login/register, redirect to questionnaire or results
  if (isPublicRoute && user && pathname !== '/auth/callback') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_completed_questionnaire')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profile?.has_completed_questionnaire
      ? '/results'
      : '/questionnaire';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
