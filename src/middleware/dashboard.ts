import { NextRequest, NextResponse } from 'next/server';
import { getDashboardPath, Role } from '../auth/roles';

export function redirectDashboard(request: NextRequest): NextResponse {
  const role = (request.headers.get('x-user-role') as Role) || 'employee';
  const target = getDashboardPath(role);
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.next();
}
