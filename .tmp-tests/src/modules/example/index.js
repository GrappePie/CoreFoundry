"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventBus_1 = require("../../messaging/eventBus");
(0, eventBus_1.subscribe)("greeting", async (payload) => {
    console.warn("received:", payload.text);
});
async function main() {
    await (0, eventBus_1.publish)("greeting", { text: "hello" });
}
main().catch(console.error);
