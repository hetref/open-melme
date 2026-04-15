import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Check environment variables for maintenance mode and registration control
  const isMaintenanceMode = process.env.MAINTAINANCE_STATUS === 'true';

  // MAINTENANCE MODE: Block access to dashboard and login
  if (isMaintenanceMode) {
    // Allow only maintenance page and public assets
    const allowedPaths = ['/maintenance', '/_next', '/favicon.ico', '/api/auth'];
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

    if (!isAllowedPath && pathname !== '/') {
      // Redirect to maintenance page
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
    }

    // Redirect root to maintenance if not already there
    if (pathname === '/' && !request.nextUrl.searchParams.has('maintenance')) {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
    }
  }

  // REGISTRATION CONTROL: Block registration when disabled - PROXY LEVEL
  // if (!isRegistrationAllowed && !isMaintenanceMode) {
  //     if (pathname === '/register') {
  //         const url = request.nextUrl.clone();
  //         url.pathname = '/login';
  //         url.searchParams.set('registration_disabled', 'true');
  //         return NextResponse.redirect(url);
  //     }
  // }

  // Allow the request to continue
  // Note: Authentication is handled by layout components, not proxy
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};