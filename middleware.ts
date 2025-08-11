import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { verifyModuleScopes } from '@/app/api/middleware';

export async function middleware(request: NextRequest) {
  auth();
  return verifyModuleScopes(request);
}

export const config = {
  matcher: ['/api/:path*'],
};

