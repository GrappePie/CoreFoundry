import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getModules } from '@/services/moduleDiscovery';

export async function GET() {
  await dbConnect();
  const modules = await getModules();
  return NextResponse.json(modules);
}
