import dbConnect from '@/lib/mongodb';
import * as controller from '@/services/schemaRegistry/schemaRegistry.controller';

export async function GET(req: Request) {
  await dbConnect();
  return controller.GET(req);
}

export async function POST(req: Request) {
  await dbConnect();
  return controller.POST(req);
}

