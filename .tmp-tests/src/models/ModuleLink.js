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
const ajv_1 = __importDefault(require("ajv"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const ajv = new ajv_1.default();
const ModuleLinkSchema = new mongoose_1.Schema({
    fromModule: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Module', required: true },
    toModule: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Module', required: true },
    mappingRules: { type: mongoose_1.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastExecution: Date,
    executionCount: { type: Number, default: 0 },
    deletedAt: Date,
}, { timestamps: true });
// Validate mappingRules schema
ModuleLinkSchema.pre('save', function (next) {
    if (!ajv.validateSchema(this.mappingRules)) {
        return next(new Error('Invalid mappingRules schema: ' + ajv.errorsText(ajv.errors)));
    }
    next();
});
// Plugins
ModuleLinkSchema.plugin(mongoose_paginate_v2_1.default);
// Indexes
ModuleLinkSchema.index({ fromModule: 1 });
ModuleLinkSchema.index({ toModule: 1 });
ModuleLinkSchema.index({ deletedAt: 1 });
exports.default = mongoose_1.models.ModuleLink || mongoose_1.default.model('ModuleLink', ModuleLinkSchema);
