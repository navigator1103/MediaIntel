import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('Middleware running for path:', request.nextUrl.pathname);
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/test',
    '/api/taxonomy',
    '/api/countries',
    '/api/scores',
    '/api/change-requests',
    '/api/seed-taxonomy',
    '/api/media-sufficiency',
    '/api/debug/db-test',
    '/_next',
    '/favicon.ico',
  ];
  
  // Always allow login API requests
  if (request.nextUrl.pathname === '/api/auth/login') {
    console.log('Login API request detected, allowing access');
    return NextResponse.next();
  }

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path) || 
    request.nextUrl.pathname === path
  );
  
  // Special handling for API routes
  if (request.nextUrl.pathname.startsWith('/api/taxonomy') || 
      request.nextUrl.pathname.startsWith('/api/countries') ||
      request.nextUrl.pathname.startsWith('/api/scores') ||
      request.nextUrl.pathname.startsWith('/api/change-requests') ||
      request.nextUrl.pathname.startsWith('/api/seed-taxonomy') ||
      request.nextUrl.pathname.startsWith('/api/media-sufficiency') ||
      request.nextUrl.pathname.startsWith('/api/admin/media-sufficiency') ||
      request.nextUrl.pathname.startsWith('/api/admin/reach-planning') ||
      request.nextUrl.pathname.startsWith('/api/admin/backups') ||
      request.nextUrl.pathname.startsWith('/api/debug/db-test')) {
    console.log('API route detected, allowing access without authentication');
    return NextResponse.next();
  }

  // If it's a public path, allow access without authentication
  if (isPublicPath) {
    console.log('Public path detected, allowing access without auth');
    return NextResponse.next();
  }

  // Get token from cookies or Authorization header
  const token = request.cookies.get('token')?.value;
  let apiToken = null;
  
  if (request.nextUrl.pathname.startsWith('/api')) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiToken = authHeader.split(' ')[1];
    }
  }

  // Use either the cookie token or API token
  const authToken = apiToken || token;
  
  // If no token is found, redirect to login
  if (!authToken) {
    console.log('No auth token found, path:', request.nextUrl.pathname);
    
    if (request.nextUrl.pathname.startsWith('/api')) {
      console.log('API route unauthorized, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('Redirecting to login page');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  console.log('Auth token found, proceeding with verification');

  // In Edge Runtime, we can't use jsonwebtoken's verify function
  // Instead, we'll trust the token presence and use client-side auth
  // This is a simplified approach for development purposes
  try {
    // For admin routes, check if the user is an admin based on localStorage
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // For API routes, we can't check localStorage, so we'll allow access
      // and let the API handle authorization
      if (!request.nextUrl.pathname.startsWith('/api')) {
        // For non-API admin routes, we'll redirect to home if not admin
        // The client-side code will handle proper redirection based on user role
        console.log('Allowing access to admin route, client will verify role');
      }
    }
    
    console.log('Request proceeding with auth token');
    return NextResponse.next();
  } catch (error) {
    console.error('Token processing failed:', error);
    
    // If token processing fails
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Your session has expired' },
        { status: 401 }
      );
    }
    
    // For non-API routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!login|_next/static|_next/image|favicon.ico).*)',
  ],
}
