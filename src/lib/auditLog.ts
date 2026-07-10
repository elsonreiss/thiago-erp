import { container } from "@/container";

export interface LogAuditParams {
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: string | null;
}

/** Registra uma ação de auditoria. Nunca lança erro — uma falha no log não deve derrubar a operação principal. */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await container.auditLogRepository.create({
      user_id: params.userId,
      user_name: params.userName,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      details: params.details ?? null,
    });
  } catch (err) {
    console.error("[auditLog] falha ao registrar log de auditoria", err);
  }
}
