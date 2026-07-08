"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import { PaymentMethod } from "@/domain/entities/Sale";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";
import { formatCurrency, parseCurrencyInput } from "@/lib/format";

const METHODS: PaymentMethod[] = ["dinheiro", "pix", "cartao_debito", "cartao_credito", "boleto"];

export function RegisterPaymentForm({ noteId, remaining }: { noteId: number; remaining: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(remaining.toFixed(2).replace(".", ","));
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/customer-notes/${noteId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseCurrencyInput(amount), payment_method: method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao registrar pagamento.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-bg-secondary p-4">
      <p className="text-sm font-medium text-text-primary">Registrar pagamento</p>
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Valor pago (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
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
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
          Confirmar pagamento
        </button>
      </div>
      <p className="text-xs text-text-muted">Saldo devedor atual: {formatCurrency(remaining)}</p>
    </form>
  );
}
