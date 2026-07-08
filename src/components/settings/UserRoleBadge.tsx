import { UserRole } from "@/domain/entities/User";

const CONFIG: Record<UserRole, { label: string; className: string }> = {
  admin: { label: "Administrador", className: "bg-accent-soft text-accent" },
  gerente: { label: "Gerente", className: "bg-success-soft text-success" },
  funcionario: { label: "Funcionário", className: "bg-bg-tertiary text-text-secondary" },
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  const config = CONFIG[role];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
