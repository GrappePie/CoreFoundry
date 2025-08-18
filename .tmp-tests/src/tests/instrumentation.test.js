"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const orchestrator = __importStar(require("../services/moduleOrchestrator"));
const instrumentation_1 = require("../../instrumentation");
const origStart = orchestrator.startModuleOrchestrator;
let started;
(0, node_test_1.describe)('instrumentation', () => {
    (0, node_test_1.beforeEach)(() => {
        started = false;
        orchestrator.startModuleOrchestrator = () => {
            started = true;
        };
        delete process.env.NEXT_RUNTIME;
    });
    (0, node_test_1.afterEach)(() => {
        orchestrator.startModuleOrchestrator = origStart;
        delete process.env.NEXT_RUNTIME;
    });
    (0, node_test_1.it)('starts orchestrator when running in node runtime', () => {
        process.env.NEXT_RUNTIME = 'nodejs';
        (0, instrumentation_1.register)();
        strict_1.default.ok(started);
    });
    (0, node_test_1.it)('does not start orchestrator in edge runtime', () => {
        process.env.NEXT_RUNTIME = 'edge';
        (0, instrumentation_1.register)();
        strict_1.default.equal(started, false);
    });
});
