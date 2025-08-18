"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleManifestSchema = void 0;
exports.moduleManifestSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        description: { type: 'string', nullable: true },
        endpoints: {
            type: 'object',
            properties: {
                rest: { type: 'string' },
                ws: { type: 'string', nullable: true },
            },
            required: ['rest'],
            additionalProperties: false,
        },
        events: {
            type: 'object',
            properties: {
                publish: { type: 'array', items: { type: 'string' }, nullable: true },
                subscribe: { type: 'array', items: { type: 'string' }, nullable: true },
            },
            additionalProperties: false,
            nullable: true,
        },
        schemas: { type: 'object', additionalProperties: true },
        dependencies: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
        },
    },
    required: ['name', 'version', 'endpoints', 'schemas'],
    additionalProperties: false,
};
