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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email.'],
        unique: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password.'],
        select: false, // Do not return password by default
    },
    role: {
        type: String,
        enum: ['owner', 'employee', 'admin'],
        required: true,
        default: 'employee',
    },
    subscription: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
    },
    modulesEnabled: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Module' }],
    lastLogin: Date,
    emailVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    subscriptionStart: Date,
    subscriptionEnd: Date,
    deletedAt: Date,
}, { timestamps: true });
// Hooks
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
// Methods
UserSchema.methods.comparePassword = function (candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
};
// toJSON transform
UserSchema.set('toJSON', {
    transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});
// Plugins and indexes
UserSchema.plugin(mongoose_paginate_v2_1.default);
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ subscription: 1 });
UserSchema.index({ modulesEnabled: 1 });
UserSchema.index({ deletedAt: 1 });
exports.default = mongoose_1.models.User || mongoose_1.default.model('User', UserSchema);
