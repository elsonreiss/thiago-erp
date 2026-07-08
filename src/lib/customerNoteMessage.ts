import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";
import { formatCurrency, formatDate } from "@/lib/format";

/** Monta o texto do extrato de fiado de um cliente, pronto pra colar/enviar no WhatsApp. */
export function buildCustomerNotesWhatsAppMessage(
  customerName: string,
  notes: CustomerNoteWithItems[],
  storeName = "Thiago Casa & Construção"
): string {
  const openNotes = notes.filter((n) => n.status !== "pago");
  const totalDevido = openNotes.reduce(
    (sum, n) => sum + Math.max(0, parseFloat(n.total) - parseFloat(n.paid_amount)),
    0
  );

  const lines: string[] = [];
  lines.push(`*${storeName}*`);
  lines.push(`Extrato de fiado — ${customerName}`);
  lines.push("");

  if (openNotes.length === 0) {
    lines.push("Nenhuma nota em aberto no momento. Tudo quitado!");
  } else {
    for (const note of openNotes) {
      const saldo = Math.max(0, parseFloat(note.total) - parseFloat(note.paid_amount));
      lines.push(`*${formatDate(note.created_at)}*`);
      for (const item of note.items) {
        lines.push(`• ${item.quantity}x ${item.product_name} — ${formatCurrency(item.subtotal)}`);
      }
      if (note.description) lines.push(`Obs: ${note.description}`);
      lines.push(`Total: ${formatCurrency(note.total)} | Pago: ${formatCurrency(note.paid_amount)} | Saldo: ${formatCurrency(saldo)}`);
      lines.push("");
    }
    lines.push(`*Total devido: ${formatCurrency(totalDevido)}*`);
  }

  lines.push("");
  lines.push("Qualquer dúvida, estamos à disposição!");

  return lines.join("\n");
}
