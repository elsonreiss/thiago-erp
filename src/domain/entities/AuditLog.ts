export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
}
