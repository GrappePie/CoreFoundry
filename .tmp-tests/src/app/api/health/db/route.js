"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("@/lib/mongodb"));
async function GET() {
    try {
        await (0, mongodb_1.default)();
        return server_1.NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        return server_1.NextResponse.json({ status: 'error', error: message }, { status: 503 });
    }
}
