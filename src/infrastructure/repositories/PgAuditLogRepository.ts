import { query } from "@/infrastructure/db";
import { AuditLog } from "@/domain/entities/AuditLog";
import { AuditLogRepository, CreateAuditLogInput } from "@/domain/repositories/AuditLogRepository";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

export class PgAuditLogRepository implements AuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const { rows } = await query<AuditLog>(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        input.user_id,
        input.user_name,
        input.action,
        input.entity_type,
        input.entity_id ?? null,
        input.details ?? null,
      ]
    );
    return rows[0];
  }

  async findPage(page: number, pageSize: number): Promise<PaginatedResult<AuditLog>> {
    const offset = (page - 1) * pageSize;
    const { rows: countRows } = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM audit_logs`);
    const total = Number(countRows[0]?.count ?? 0);

    const { rows } = await query<AuditLog>(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );
    return buildPaginatedResult(rows, total, page, pageSize);
  }
}
