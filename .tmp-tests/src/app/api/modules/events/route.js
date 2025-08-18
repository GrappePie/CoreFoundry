"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const eventBus_1 = require("@/messaging/eventBus");
async function GET() {
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            const send = (event, data) => {
                controller.enqueue(encoder.encode(`event: ${event}\n`));
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };
            await (0, eventBus_1.subscribe)("module.online", (payload) => send("module.online", payload));
            await (0, eventBus_1.subscribe)("module.offline", (payload) => send("module.offline", payload));
            await (0, eventBus_1.subscribe)("module.removed", (payload) => send("module.removed", payload));
        },
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
