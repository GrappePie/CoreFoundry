"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASHBOARD_PATHS = void 0;
exports.getDashboardPath = getDashboardPath;
exports.DASHBOARD_PATHS = {
    owner: '/dashboard/owner',
    admin: '/dashboard/admin',
    employee: '/dashboard/employee',
};
function getDashboardPath(role) {
    return exports.DASHBOARD_PATHS[role];
}
