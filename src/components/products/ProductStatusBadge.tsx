import { ProductStockStatus } from "@/domain/entities/Product";

const CONFIG: Record<ProductStockStatus, { label: string; className: string }> = {
  em_falta: { label: "Em falta", className: "bg-danger-soft text-danger" },
  estoque_baixo: { label: "Estoque baixo", className: "bg-warning-soft text-warning" },
  ok: { label: "OK", className: "bg-success-soft text-success" },
};

export function ProductStatusBadge({ status }: { status: ProductStockStatus }) {
  const config = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
