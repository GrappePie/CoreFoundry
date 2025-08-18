"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuditService = initAuditService;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const rabbitmq_1 = require("./rabbitmq");
const UserRegistered_schema_1 = require("../schemas/events/UserRegistered.schema");
let auditInitialized = false;
/**
 * Inicializa suscripciones de auditoría para eventos del sistema
 */
async function initAuditService() {
    if (auditInitialized)
        return;
    await (0, rabbitmq_1.subscribe)('audit.user.registered', rabbitmq_1.EXCHANGE_NAME, 'auth.user.registered', async (payload) => {
        await AuditLog_1.default.create({
            userId: payload.userId,
            action: 'user.registered',
            payload: { email: payload.email },
            result: 'success',
            timestamp: new Date(),
        });
    }, UserRegistered_schema_1.UserRegisteredSchema);
    auditInitialized = true;
}
