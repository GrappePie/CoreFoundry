import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../lib/mongodb';
import Module from '../models/Module';

/**
 * Verifies that the requesting module has the required permissions.
 * The middleware expects two headers:
 *  - X-Module-Id: identifier of the calling module
 *  - X-Module-Scopes: comma separated list of required permissions
 */
export async function verifyModulePermissions(request: NextRequest): Promise<NextResponse> {
  await dbConnect();
  const moduleId = request.headers.get('x-module-id');
  if (!moduleId) {
    return NextResponse.json({ message: 'X-Module-Id header required' }, { status: 401 });
  }
  let mod;
  try {
    mod = await Module.findById(moduleId);
  } catch {
    return NextResponse.json({ message: 'Module not found' }, { status: 404 });
  }
  if (!mod) {
    return NextResponse.json({ message: 'Module not found' }, { status: 404 });
  }
  const requiredHeader = request.headers.get('x-module-scopes');
  if (!requiredHeader) {
    return NextResponse.json({ message: 'X-Module-Scopes header required' }, { status: 401 });
  }
  const requiredPermissions = requiredHeader
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const hasPermissions = requiredPermissions.every((scope) =>
    mod.permissions.includes(scope)
  );
  if (!hasPermissions) {
    return NextResponse.json({ message: 'Insufficient module permissions' }, { status: 403 });
  }
  return NextResponse.next();
}
