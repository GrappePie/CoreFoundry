"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const logger_1 = __importDefault(require("../logger"));
(0, node_test_1.describe)('logger', () => {
    (0, node_test_1.it)('exposes standard logging methods', () => {
        strict_1.default.equal(typeof logger_1.default.info, 'function');
        strict_1.default.equal(typeof logger_1.default.warn, 'function');
        strict_1.default.equal(typeof logger_1.default.error, 'function');
        strict_1.default.equal(typeof logger_1.default.debug, 'function');
    });
});
