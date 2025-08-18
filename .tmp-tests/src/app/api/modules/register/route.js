"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("@/lib/mongodb"));
const moduleDiscovery_1 = require("@/services/moduleDiscovery");
const auth_1 = require("@/auth");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string(),
    version: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    ownerId: zod_1.z.string(),
    manifest: zod_1.z.any(),
    endpoints: zod_1.z.object({
        rest: zod_1.z.string().url(),
        ws: zod_1.z.string().url().optional(),
    }),
});
const CORE_MODULE_VERSION = process.env.CORE_MODULE_VERSION || '1.0.0';
function isCompatible(version) {
    const coreParts = CORE_MODULE_VERSION.split('.');
    const moduleParts = version.split('.');
    return coreParts[0] === moduleParts[0];
}
async function POST(req) {
    await (0, mongodb_1.default)();
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return server_1.NextResponse.json({ status: 'unauthorized', error: 'Missing or invalid token' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload || typeof payload.userId !== 'string') {
            return server_1.NextResponse.json({ status: 'unauthorized', error: 'Invalid token' }, { status: 401 });
        }
        const body = await req.json();
        const parse = registerSchema.safeParse(body);
        if (!parse.success) {
            return server_1.NextResponse.json({ status: 'validation_error', errors: parse.error.issues }, { status: 400 });
        }
        const data = parse.data;
        if (payload.userId !== data.ownerId) {
            return server_1.NextResponse.json({ status: 'forbidden', error: 'Owner mismatch' }, { status: 403 });
        }
        const compatibleVersion = isCompatible(data.version);
        if (!compatibleVersion) {
            return server_1.NextResponse.json({
                status: 'incompatible_version',
                error: `Module version ${data.version} incompatible with core version ${CORE_MODULE_VERSION}`,
            }, { status: 400 });
        }
        let status = 'offline';
        let lastHandshake;
        try {
            const ping = await fetch(`${data.endpoints.rest.replace(/\/$/, '')}/ping`);
            if (ping.ok) {
                status = 'online';
                lastHandshake = new Date();
            }
        }
        catch {
            // Module unreachable, keep status offline
        }
        const { module, integrationToken } = await (0, moduleDiscovery_1.registerModule)({
            ...data,
            status,
            lastHandshake,
            compatibleVersion,
        });
        return server_1.NextResponse.json({
            status: 'registered',
            moduleId: module._id,
            integrationToken,
            online: status === 'online',
            message: status === 'online'
                ? 'Module registered and online.'
                : 'Module registered but unreachable.',
        }, { status: 201 });
    }
    catch (error) {
        console.error('Module registration error:', error);
        return server_1.NextResponse.json({ status: 'error', error: 'Internal server error' }, { status: 500 });
    }
}
