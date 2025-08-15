import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyModulePermissions } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  auth();
  if (request.nextUrl.pathname.startsWith('/api')) {
    return verifyModulePermissions(request);
  }
  // Redirect any dashboard subpath back to /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard/') && request.nextUrl.pathname !== '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
