"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.publish = publish;
exports.subscribe = subscribe;
const rabbitmq = __importStar(require("../lib/rabbitmq"));
function genId() {
    var _a;
    // Usar Web Crypto si está disponible (Edge/Browser); fallback simple en otros entornos
    const g = globalThis;
    if ((_a = g === null || g === void 0 ? void 0 : g.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID)
        return g.crypto.randomUUID();
    // Fallback no-cryptográfico suficiente para nombres de cola efímeros
    return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}`;
}
/**
 * Publish an event to the default exchange.
 */
async function publish(type, payload) {
    await rabbitmq.publish(rabbitmq.EXCHANGE_NAME, type, payload);
}
/**
 * Subscribe to a given event type using a unique queue per subscriber.
 */
async function subscribe(type, handler) {
    const queue = `${type}.${genId()}`;
    await rabbitmq.subscribe(queue, rabbitmq.EXCHANGE_NAME, type, async (payload) => {
        await handler(payload);
    });
}
