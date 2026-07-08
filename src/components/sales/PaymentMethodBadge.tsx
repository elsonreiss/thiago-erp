import { PaymentMethod } from "@/domain/entities/Sale";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

const COLORS: Record<PaymentMethod, string> = {
  dinheiro: "bg-success-soft text-success",
  pix: "bg-accent-soft text-accent",
  cartao_debito: "bg-bg-tertiary text-text-secondary",
  cartao_credito: "bg-bg-tertiary text-text-secondary",
  boleto: "bg-warning-soft text-warning",
  fiado: "bg-danger-soft text-danger",
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${COLORS[method]}`}>
      {PAYMENT_METHOD_LABELS[method]}
    </span>
  );
}
