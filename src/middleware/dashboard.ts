import { NextRequest, NextResponse } from 'next/server';
import { getDashboardPath, Role } from '../auth/roles';

export function redirectDashboard(request: NextRequest): NextResponse {
  // Obtain the role from authentication/session cookies instead of headers
  const role = (request.cookies.get('user-role')?.value as Role) || 'employee';
  const target = getDashboardPath(role);
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.next();
}
