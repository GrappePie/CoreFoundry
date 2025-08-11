import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../lib/mongodb';
import Module from '../../models/Module';

export async function verifyModuleScopes(request: NextRequest): Promise<NextResponse> {
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
  const requiredScopes = requiredHeader.split(',').map(s => s.trim()).filter(Boolean);
  const hasScopes = requiredScopes.every(scope => mod.scopes.includes(scope));
  if (!hasScopes) {
    return NextResponse.json({ message: 'Insufficient module scopes' }, { status: 403 });
  }
  return NextResponse.next();
}
