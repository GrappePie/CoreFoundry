import AuditLog from '@/models/AuditLog';
import { subscribe, EXCHANGE_NAME } from '@/lib/rabbitmq';
import { UserRegisteredSchema } from '@/schemas/events/UserRegistered.schema';

let auditInitialized = false;

/**
 * Inicializa suscripciones de auditoría para eventos del sistema
 */
export async function initAuditService(): Promise<void> {
  if (auditInitialized) return;
  await subscribe(
    'audit.user.registered',
    EXCHANGE_NAME,
    'auth.user.registered',
    async (payload: { userId: string; email: string }) => {
      await AuditLog.create({
        userId: payload.userId,
        action: 'user.registered',
        payload: { email: payload.email },
        result: 'success',
        timestamp: new Date(),
      });
    },
    UserRegisteredSchema
  );
  auditInitialized = true;
}
