import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { connectRabbit, EXCHANGE_NAME } from '@/lib/rabbitmq';

export async function GET() {
  const mqDisabled = String(process.env.RABBITMQ_DISABLED || '').toLowerCase() === 'true';

  const dbCheck = (async () => {
    try {
      await dbConnect();
      return { status: 'ok' as const };
    } catch (err: unknown) {
      return { status: 'error' as const, error: err instanceof Error ? err.message : 'unknown' };
    }
  })();

  const mqCheck = (async () => {
    if (mqDisabled) return { status: 'disabled' as const };
    try {
      const ch = await connectRabbit();
      await ch.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      return { status: 'ok' as const };
    } catch (err: unknown) {
      return { status: 'error' as const, error: err instanceof Error ? err.message : 'unknown' };
    }
  })();

  const [db, mq] = await Promise.all([dbCheck, mqCheck]);

  const status = db.status === 'ok' && (mq.status === 'ok' || mq.status === 'disabled')
    ? 'ok'
    : db.status === 'ok' || (mq.status === 'ok' || mq.status === 'disabled')
      ? 'degraded'
      : 'error';

  const http = status === 'ok' ? 200 : status === 'degraded' ? 206 : 503;

  return NextResponse.json({ status, db, mq }, { status: http });
}

