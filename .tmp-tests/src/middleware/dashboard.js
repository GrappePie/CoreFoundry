"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectDashboard = redirectDashboard;
const server_1 = require("next/server");
const roles_1 = require("../auth/roles");
function redirectDashboard(request) {
    var _a;
    // Obtain the role from authentication/session cookies instead of headers
    const role = ((_a = request.cookies.get('user-role')) === null || _a === void 0 ? void 0 : _a.value) || 'employee';
    const target = (0, roles_1.getDashboardPath)(role);
    if (request.nextUrl.pathname === '/dashboard') {
        return server_1.NextResponse.redirect(new URL(target, request.url));
    }
    return server_1.NextResponse.next();
}
