"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
(0, node_test_1.describe)('AuthMenu', () => {
    (0, node_test_1.it)('contains a dashboard link', () => {
        const content = (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), 'src/components/AuthMenu.tsx'), 'utf-8');
        strict_1.default.ok(content.includes('href="/dashboard"'));
    });
});
