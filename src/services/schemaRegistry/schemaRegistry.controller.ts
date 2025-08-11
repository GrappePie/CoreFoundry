import { NextResponse } from 'next/server';
import SchemaDefinition from './schemaDefinition.model';

export async function GET(_req: Request) {
  const schemas = await SchemaDefinition.find();
  return NextResponse.json(schemas);
}

export async function POST(req: Request) {
  const { $id, version, schema } = await req.json();
  if (!$id || !version || !schema) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }
  const doc = await SchemaDefinition.create({ schemaId: $id, version, schema });
  return NextResponse.json(doc, { status: 201 });
}
