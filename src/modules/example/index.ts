import { publish, subscribe } from "../../messaging/eventBus";

subscribe("greeting", async (payload: { text: string }) => {
  console.warn("received:", payload.text);
});

async function main() {
  await publish("greeting", { text: "hello" });
}

main().catch(console.error);
