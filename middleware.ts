import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { verifyModulePermissions } from '@/middleware/auth';

export async function middleware(request: NextRequest) {
  auth();
  return verifyModulePermissions(request);
}

export const config = {
  matcher: ['/api/:path*'],
};

