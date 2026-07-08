import { BudgetWithItems } from "@/domain/entities/Budget";
import { formatCurrency, formatDate } from "@/lib/format";

/** Monta o texto do orçamento pronto pra colar/enviar no WhatsApp. */
export function buildBudgetWhatsAppMessage(
  budget: BudgetWithItems,
  storeName = "Thiago Casa & Construção"
): string {
  const subtotal = budget.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const discount = parseFloat(budget.discount);

  const lines: string[] = [];
  lines.push(`*${storeName}*`);
  lines.push(`Orçamento`);
  lines.push("");
  if (budget.customer_name) lines.push(`Cliente: ${budget.customer_name}`);
  lines.push("");
  lines.push("*Itens:*");
  for (const item of budget.items) {
    lines.push(
      `• ${item.quantity}x ${item.product_name} — ${formatCurrency(item.unit_price)} = ${formatCurrency(item.subtotal)}`
    );
  }
  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (discount > 0) lines.push(`Desconto: -${formatCurrency(budget.discount)}`);
  lines.push(`*Total: ${formatCurrency(budget.total)}*`);
  if (budget.validity_date) {
    lines.push("");
    lines.push(`Válido até: ${formatDate(budget.validity_date)}`);
  }
  if (budget.notes) {
    lines.push("");
    lines.push(`Obs: ${budget.notes}`);
  }
  lines.push("");
  lines.push("Qualquer dúvida, estamos à disposição!");

  return lines.join("\n");
}
