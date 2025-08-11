import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { registerModule } from '@/services/moduleDiscovery';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  ownerId: z.string(),
  manifest: z.any(),
  endpoints: z.object({
    rest: z.string().url(),
    ws: z.string().url().optional(),
  }),
});

const CORE_MODULE_VERSION = process.env.CORE_MODULE_VERSION || '1.0.0';

function isCompatible(version: string): boolean {
  const coreParts = CORE_MODULE_VERSION.split('.');
  const moduleParts = version.split('.');
  return coreParts[0] === moduleParts[0];
}

export async function POST(req: Request) {
  await dbConnect();

  try {
    const body = await req.json();
    const parse = registerSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { status: 'validation_error', errors: parse.error.issues },
        { status: 400 }
      );
    }

    const data = parse.data;
    const compatibleVersion = isCompatible(data.version);

    if (!compatibleVersion) {
      return NextResponse.json(
        {
          status: 'incompatible_version',
          error: `Module version ${data.version} incompatible with core version ${CORE_MODULE_VERSION}`,
        },
        { status: 400 }
      );
    }

    let status: 'online' | 'offline' = 'offline';
    let lastHandshake: Date | undefined;

    try {
      const ping = await fetch(`${data.endpoints.rest.replace(/\/$/, '')}/ping`);
      if (ping.ok) {
        status = 'online';
        lastHandshake = new Date();
      }
    } catch (err) {
      // Module unreachable, keep status offline
    }

    const { module, integrationToken } = await registerModule({
      ...data,
      status,
      lastHandshake,
      compatibleVersion,
    });

    return NextResponse.json(
      {
        status: 'registered',
        moduleId: module._id,
        integrationToken,
        online: status === 'online',
        message:
          status === 'online'
            ? 'Module registered and online.'
            : 'Module registered but unreachable.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Module registration error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Internal server error' },
      { status: 500 }
    );
  }
}
