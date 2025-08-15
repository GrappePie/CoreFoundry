import { subscribe } from "@/messaging/eventBus";

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      await subscribe("module.online", (payload) => send("module.online", payload));
      await subscribe("module.offline", (payload) => send("module.offline", payload));
      await subscribe("module.removed", (payload) => send("module.removed", payload));
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

