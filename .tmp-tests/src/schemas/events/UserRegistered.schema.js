"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRegisteredSchema = void 0;
exports.UserRegisteredSchema = {
    type: 'object',
    properties: {
        userId: { type: 'string' },
        email: { type: 'string', format: 'email' },
    },
    required: ['userId', 'email'],
    additionalProperties: false,
};
