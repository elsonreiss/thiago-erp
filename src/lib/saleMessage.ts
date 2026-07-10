import { SaleWithItems } from "@/domain/entities/Sale";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

/** Monta o texto do comprovante de venda pronto pra colar/enviar no WhatsApp. */
export function buildSaleWhatsAppMessage(sale: SaleWithItems, storeName = "Thiago Casa & Construção"): string {
  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const discount = parseFloat(sale.discount);

  const lines: string[] = [];
  lines.push(`*${storeName}*`);
  lines.push(`Comprovante de venda #${sale.id}`);
  lines.push(formatDateTime(sale.created_at));
  lines.push("");
  lines.push(`Cliente: ${sale.customer_name ?? "Consumidor final"}`);
  lines.push("");
  lines.push("*Itens:*");
  for (const item of sale.items) {
    lines.push(
      `• ${item.quantity}x ${item.product_name} — ${formatCurrency(item.unit_price)} = ${formatCurrency(item.subtotal)}`
    );
  }
  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (discount > 0) lines.push(`Desconto: -${formatCurrency(sale.discount)}`);
  lines.push(`*Total: ${formatCurrency(sale.total)}*`);
  lines.push(`Pagamento: ${PAYMENT_METHOD_LABELS[sale.payment_method]}`);
  if (sale.notes) {
    lines.push("");
    lines.push(`Obs: ${sale.notes}`);
  }
  lines.push("");
  lines.push("Obrigado pela preferência!");

  return lines.join("\n");
}
