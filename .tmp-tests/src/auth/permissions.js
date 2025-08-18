"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.ROLE_PERMISSIONS = {
    owner: ['*'],
    admin: ['manage:users', 'manage:modules'],
    employee: ['read:basic'],
};
