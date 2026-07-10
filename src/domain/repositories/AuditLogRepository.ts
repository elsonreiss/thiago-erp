import { AuditLog } from "@/domain/entities/AuditLog";
import { PaginatedResult } from "@/lib/pagination";

export interface CreateAuditLogInput {
  user_id: number | null;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  details?: string | null;
}

export interface AuditLogRepository {
  create(input: CreateAuditLogInput): Promise<AuditLog>;
  findPage(page: number, pageSize: number): Promise<PaginatedResult<AuditLog>>;
}
