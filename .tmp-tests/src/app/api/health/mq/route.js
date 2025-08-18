"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const rabbitmq_1 = require("@/lib/rabbitmq");
async function GET() {
    try {
        if (String(process.env.RABBITMQ_DISABLED || '').toLowerCase() === 'true') {
            return server_1.NextResponse.json({ status: 'disabled' }, { status: 200 });
        }
        const ch = await (0, rabbitmq_1.connectRabbit)();
        // toque mínimo: asegurar que el exchange por defecto existe
        await ch.assertExchange(rabbitmq_1.EXCHANGE_NAME, 'topic', { durable: true });
        return server_1.NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        return server_1.NextResponse.json({ status: 'error', error: message }, { status: 503 });
    }
}
