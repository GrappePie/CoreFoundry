"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("@/lib/mongodb"));
const rabbitmq_1 = require("@/lib/rabbitmq");
async function GET() {
    const mqDisabled = String(process.env.RABBITMQ_DISABLED || '').toLowerCase() === 'true';
    const dbCheck = (async () => {
        try {
            await (0, mongodb_1.default)();
            return { status: 'ok' };
        }
        catch (err) {
            return { status: 'error', error: err instanceof Error ? err.message : 'unknown' };
        }
    })();
    const mqCheck = (async () => {
        if (mqDisabled)
            return { status: 'disabled' };
        try {
            const ch = await (0, rabbitmq_1.connectRabbit)();
            await ch.assertExchange(rabbitmq_1.EXCHANGE_NAME, 'topic', { durable: true });
            return { status: 'ok' };
        }
        catch (err) {
            return { status: 'error', error: err instanceof Error ? err.message : 'unknown' };
        }
    })();
    const [db, mq] = await Promise.all([dbCheck, mqCheck]);
    const status = db.status === 'ok' && (mq.status === 'ok' || mq.status === 'disabled')
        ? 'ok'
        : db.status === 'ok' || (mq.status === 'ok' || mq.status === 'disabled')
            ? 'degraded'
            : 'error';
    const http = status === 'ok' ? 200 : status === 'degraded' ? 206 : 503;
    return server_1.NextResponse.json({ status, db, mq }, { status: http });
}
