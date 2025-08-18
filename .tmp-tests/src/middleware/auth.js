"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyModulePermissions = verifyModulePermissions;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("../lib/mongodb"));
const Module_1 = __importDefault(require("../models/Module"));
/**
 * Verifies that the requesting module has the required permissions.
 * The middleware expects two headers:
 *  - X-Module-Id: identifier of the calling module
 *  - X-Module-Scopes: comma separated list of required permissions
 */
async function verifyModulePermissions(request) {
    await (0, mongodb_1.default)();
    const moduleId = request.headers.get('x-module-id');
    if (!moduleId) {
        return server_1.NextResponse.json({ message: 'X-Module-Id header required' }, { status: 401 });
    }
    let mod;
    try {
        mod = await Module_1.default.findById(moduleId);
    }
    catch {
        return server_1.NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }
    if (!mod) {
        return server_1.NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }
    const requiredHeader = request.headers.get('x-module-scopes');
    if (!requiredHeader) {
        return server_1.NextResponse.json({ message: 'X-Module-Scopes header required' }, { status: 401 });
    }
    const requiredPermissions = requiredHeader
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const hasPermissions = requiredPermissions.every((scope) => mod.permissions.includes(scope));
    if (!hasPermissions) {
        return server_1.NextResponse.json({ message: 'Insufficient module permissions' }, { status: 403 });
    }
    return server_1.NextResponse.next();
}
