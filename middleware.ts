import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyModulePermissions } from '@/middleware/auth';
import { redirectDashboard } from '@/middleware/dashboard';

export async function middleware(request: NextRequest) {
  auth();
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return redirectDashboard(request);
  }
  if (request.nextUrl.pathname.startsWith('/api')) {
    return verifyModulePermissions(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
