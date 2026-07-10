"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShoppingCart, Trash2, X } from "lucide-react";
import { BudgetStatus } from "@/domain/entities/Budget";
import { PaymentMethod } from "@/domain/entities/Sale";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/payment";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function BudgetActions({ id, status }: { id: number; status: BudgetStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [showConvert, setShowConvert] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function updateStatus(newStatus: BudgetStatus) {
    setError(null);
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/budgets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao atualizar status.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleConvert() {
    setError(null);
    setLoading("convert");
    try {
      const res = await fetch(`/api/budgets/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao converter orçamento.");
        return;
      }
      router.push(`/vendas/${data.sale.id}`);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    setError(null);
    setLoading("delete");
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao excluir orçamento.");
        setShowDeleteConfirm(false);
        return;
      }
      router.push("/orcamentos");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (status === "convertido") return null;

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status !== "aprovado" && (
          <button
            type="button"
            onClick={() => updateStatus("aprovado")}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-success hover:bg-success-soft disabled:opacity-60"
          >
            {loading === "aprovado" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Aprovar
          </button>
        )}
        {status !== "recusado" && (
          <button
            type="button"
            onClick={() => updateStatus("recusado")}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            {loading === "recusado" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Recusar
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowConvert((v) => !v)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          <ShoppingCart size={14} /> Converter em venda
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-60"
        >
          {loading === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Excluir
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir orçamento"
        message="Excluir este orçamento? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={loading === "delete"}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showConvert && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-bg-secondary p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Forma de pagamento da venda</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleConvert}
            disabled={loading !== null}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
          >
            {loading === "convert" && <Loader2 size={14} className="animate-spin" />}
            Confirmar conversão (dá baixa no estoque)
          </button>
        </div>
      )}
    </div>
  );
}
