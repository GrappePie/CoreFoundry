import Broker from "../../lib/broker";

// Create a broker with one retry before moving messages to the dead‑letter queue.
const broker = new Broker({ maxRetries: 1, retryDelayMs: 50 });

// Basic publish/subscribe usage.
broker.subscribe("greeting", async (payload: { text: string }) => {
  console.warn("received:", payload.text);
});

// Demonstrate retries and DLQ handling.
broker.subscribe("task", async () => {
  throw new Error("fail");
});

broker.onDeadLetter("task", (payload) => {
  console.error("moved to DLQ:", payload);
});

async function main() {
  await broker.publish("greeting", { text: "hello" });
  await broker.publish("task", { id: 1 });
}

main().catch(console.error);
