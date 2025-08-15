import { NextResponse } from 'next/server';
import { connectRabbit, EXCHANGE_NAME } from '@/lib/rabbitmq';

export async function GET() {
  try {
    if (String(process.env.RABBITMQ_DISABLED || '').toLowerCase() === 'true') {
      return NextResponse.json({ status: 'disabled' }, { status: 200 });
    }
    const ch = await connectRabbit();
    // toque mínimo: asegurar que el exchange por defecto existe
    await ch.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ status: 'error', error: message }, { status: 503 });
  }
}

