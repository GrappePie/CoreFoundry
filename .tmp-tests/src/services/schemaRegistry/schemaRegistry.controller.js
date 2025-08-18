"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const schemaDefinition_model_1 = __importDefault(require("./schemaDefinition.model"));
async function GET(_req) {
    const schemas = await schemaDefinition_model_1.default.find();
    return server_1.NextResponse.json(schemas);
}
async function POST(req) {
    const { $id, version, schema } = await req.json();
    if (!$id || !version || !schema) {
        return server_1.NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }
    const doc = await schemaDefinition_model_1.default.create({ schemaId: $id, version, schema });
    return server_1.NextResponse.json(doc, { status: 201 });
}
