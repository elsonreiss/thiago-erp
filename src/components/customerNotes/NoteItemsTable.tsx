"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import { CustomerNoteItem } from "@/domain/entities/CustomerNote";
import { PaymentMethod } from "@/domain/entities/Sale";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { RemoveNoteItemButton } from "@/components/customerNotes/RemoveNoteItemButton";

const METHODS: PaymentMethod[] = ["dinheiro", "pix", "cartao_debito", "cartao_credito", "boleto"];

/**
 * Tabela de itens da nota com checkbox por item pra marcar quais foram pagos —
 * útil quando o cliente paga só parte da nota (alguns produtos, não todos).
 */
export function NoteItemsTable({
  noteId,
  items,
  editable,
}: {
  noteId: number;
  items: CustomerNoteItem[];
  editable: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(itemId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  const selectedItems = items.filter((i) => selected.has(i.id));
  const selectedTotal = selectedItems.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);

  async function handleMarkPaid() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/customer-notes/${noteId}/pay-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_ids: Array.from(selected), payment_method: method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao marcar itens como pagos.");
        return;
      }
      setSelected(new Set());
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              {editable && <th className="px-4 py-3 font-medium">-</th>}
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Adicionado em</th>
              <th className="px-4 py-3 font-medium text-right">Qtd.</th>
              <th className="px-4 py-3 font-medium text-right">Preço unit.</th>
              <th className="px-4 py-3 font-medium text-right">Subtotal</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {editable && <th className="px-4 py-3 font-medium text-right">-</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                {editable && (
                  <td className="px-4 py-3">
                    {!item.paid && (
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggle(item.id)}
                        className="h-4 w-4 rounded border-border accent-accent"
                        aria-label={`Selecionar ${item.product_name}`}
                      />
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-text-primary">{item.product_name}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(item.created_at)}</td>
                <td className="px-4 py-3 text-right font-numeric">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.subtotal)}</td>
                <td className="px-4 py-3">
                  {item.paid ? (
                    <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                      Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-bg-tertiary px-2.5 py-1 text-xs font-medium text-text-secondary">
                      Em aberto
                    </span>
                  )}
                </td>
                {editable && (
                  <td className="px-4 py-3 text-right">
                    {!item.paid && <RemoveNoteItemButton noteId={noteId} itemId={item.id} />}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable && selected.size > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-bg-secondary p-4">
          <div>
            <p className="text-xs text-text-muted">
              {selected.size} ite{selected.size === 1 ? "m" : "ns"} selecionado{selected.size === 1 ? "" : "s"}
            </p>
            <p className="font-numeric text-lg font-semibold text-text-primary">{formatCurrency(selectedTotal)}</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Forma de pagamento</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
            Marcar selecionados como pagos
          </button>
        </div>
      )}
    </div>
  );
}
