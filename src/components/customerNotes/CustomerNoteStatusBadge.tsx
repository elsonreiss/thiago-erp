import { CustomerNoteStatus } from "@/domain/entities/CustomerNote";

const CONFIG: Record<CustomerNoteStatus, { label: string; className: string }> = {
  aberto: { label: "Em aberto", className: "bg-danger-soft text-danger" },
  parcial: { label: "Pago parcialmente", className: "bg-warning-soft text-warning" },
  pago: { label: "Quitada", className: "bg-success-soft text-success" },
};

export function CustomerNoteStatusBadge({ status }: { status: CustomerNoteStatus }) {
  const config = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
