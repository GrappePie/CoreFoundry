"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const dashboard_1 = require("../middleware/dashboard");
const roles_1 = require("../auth/roles");
function makeRequest(path, role) {
    const url = new URL('https://example.com' + path);
    const store = { 'user-role': role };
    return {
        nextUrl: url,
        url: url.toString(),
        cookies: {
            get: (key) => {
                const value = store[key];
                return value ? { value } : undefined;
            },
        },
    };
}
(0, node_test_1.describe)('redirectDashboard', () => {
    (0, node_test_1.it)('redirects to the path for the given role', () => {
        const res = (0, dashboard_1.redirectDashboard)(makeRequest('/dashboard', 'owner'));
        strict_1.default.equal(res.headers.get('location'), 'https://example.com' + roles_1.DASHBOARD_PATHS.owner);
    });
    (0, node_test_1.it)('does nothing when already at a role path', () => {
        const res = (0, dashboard_1.redirectDashboard)(makeRequest('/dashboard/admin', 'admin'));
        strict_1.default.equal(res.headers.get('location'), null);
    });
});
