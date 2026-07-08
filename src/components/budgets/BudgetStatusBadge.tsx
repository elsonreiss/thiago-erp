import { BudgetStatus } from "@/domain/entities/Budget";

const CONFIG: Record<BudgetStatus, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning-soft text-warning" },
  aprovado: { label: "Aprovado", className: "bg-success-soft text-success" },
  recusado: { label: "Recusado", className: "bg-danger-soft text-danger" },
  convertido: { label: "Convertido em venda", className: "bg-accent-soft text-accent" },
  expirado: { label: "Expirado", className: "bg-bg-tertiary text-text-secondary" },
};

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const config = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
