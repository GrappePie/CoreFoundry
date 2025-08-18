"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("@/lib/mongodb"));
const moduleDiscovery_1 = require("@/services/moduleDiscovery");
async function GET() {
    await (0, mongodb_1.default)();
    const modules = await (0, moduleDiscovery_1.getModules)();
    return server_1.NextResponse.json(modules);
}
