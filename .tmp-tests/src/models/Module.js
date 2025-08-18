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
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const moduleManifest_1 = require("../lib/moduleManifest");
const ModuleSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    version: { type: String, required: true },
    description: { type: String, default: '' },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    manifest: { type: mongoose_1.Schema.Types.Mixed, required: true },
    manifestHistory: {
        type: [
            {
                version: { type: String, required: true },
                manifest: { type: mongoose_1.Schema.Types.Mixed, required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    },
    endpoints: {
        rest: { type: String, required: true },
        ws: { type: String },
    },
    integrationToken: { type: String, required: true },
    permissions: { type: [String], default: [] },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastHandshake: Date,
    compatibleVersion: { type: Boolean, default: false },
    deletedAt: Date,
}, { timestamps: true });
// Validate module manifest
ModuleSchema.pre('save', async function (next) {
    const doc = this;
    if (!(await (0, moduleManifest_1.approveManifest)(doc.manifest))) {
        return next(new Error('Invalid module manifest'));
    }
    if (!doc.manifestHistory) {
        doc.manifestHistory = [];
    }
    const exists = doc.manifestHistory.some((m) => m.version === doc.version);
    if (!exists) {
        doc.manifestHistory.push({
            version: doc.version,
            manifest: doc.manifest,
            createdAt: new Date(),
        });
    }
    next();
});
// Plugins
ModuleSchema.plugin(mongoose_paginate_v2_1.default);
// Indexes
ModuleSchema.index({ ownerId: 1 });
ModuleSchema.index({ name: 1 });
ModuleSchema.index({ deletedAt: 1 });
exports.default = mongoose_1.models.Module ||
    mongoose_1.default.model('Module', ModuleSchema);
