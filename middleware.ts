import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromSession } from '@/lib/session';

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/logout',
];

// Static assets and Next.js internals that should be skipped
const skipPrefixes = [
  '/_next',
  '/favicon.ico',
  '/sw.js',
  '/manifest.json',
  '/icons',
  '/screenshots',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (skipPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Skip public API routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Only protect API routes and page routes that need auth
  const isApiRoute = pathname.startsWith('/api/');
  const isPageRoute = !pathname.startsWith('/api/') && !pathname.includes('.');

  if (!isApiRoute && !isPageRoute) {
    return NextResponse.next();
  }

  // Check for valid session
  const cookieValue = request.cookies.get('session')?.value;
  const userId = await getUserIdFromSession(cookieValue);

  if (!userId) {
    if (isApiRoute) {
      // For API routes, return 401
      return NextResponse.json(
        { success: false, error: 'غير مصرح به. يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }
    // For page routes, let client-side handle it
    return NextResponse.next();
  }

  // Add userId to request headers for API routes to use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
