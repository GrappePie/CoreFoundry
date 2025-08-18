"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerModule = registerModule;
exports.getModules = getModules;
const Module_1 = __importDefault(require("../models/Module"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Registers a module and stores its metadata in the database.
 * Returns the created module along with a generated integration token.
 */
async function registerModule(data) {
    try {
        new URL(data.endpoints.rest);
    }
    catch {
        throw new Error('endpoints.rest must be a valid URL');
    }
    const existingModule = await Module_1.default.findOne({
        name: data.name,
        ownerId: data.ownerId,
    });
    if (existingModule) {
        Object.assign(existingModule, data);
        await existingModule.save();
        return {
            module: existingModule,
            integrationToken: existingModule.integrationToken,
        };
    }
    const integrationToken = crypto_1.default.randomBytes(32).toString('hex');
    const savedModule = await Module_1.default.create({ ...data, integrationToken });
    return { module: savedModule, integrationToken };
}
/**
 * Retrieves the list of registered modules.
 */
async function getModules() {
    return Module_1.default.find();
}
