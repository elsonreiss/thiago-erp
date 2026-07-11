"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { formatCurrency, parseCurrencyInput, toCurrencyInputValue } from "@/lib/format";

interface CashClosingFormProps {
  closingDate: string;
  salesCash: number;
  initialOpeningAmount?: string;
  initialCountedCash?: string;
  initialNotes?: string | null;
  alreadyClosed: boolean;
}

export function CashClosingForm({
  closingDate,
  salesCash,
  initialOpeningAmount,
  initialCountedCash,
  initialNotes,
  alreadyClosed,
}: CashClosingFormProps) {
  const router = useRouter();
  const [opening, setOpening] = useState(
    initialOpeningAmount ? toCurrencyInputValue(initialOpeningAmount) : "0,00"
  );
  const [counted, setCounted] = useState(
    initialCountedCash ? toCurrencyInputValue(initialCountedCash) : "0,00"
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const expectedTotal = useMemo(() => {
    const openingNum = parseFloat(parseCurrencyInput(opening));
    return openingNum + salesCash;
  }, [opening, salesCash]);

  const difference = useMemo(() => {
    const countedNum = parseFloat(parseCurrencyInput(counted));
    return countedNum - expectedTotal;
  }, [counted, expectedTotal]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/cash-closings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closing_date: closingDate,
          opening_amount: parseCurrencyInput(opening),
          counted_cash: parseCurrencyInput(counted),
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao registrar fechamento.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const diffLabel =
    Math.abs(difference) < 0.005 ? "text-text-secondary" : difference > 0 ? "text-success" : "text-danger";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {saved && (
        <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          <CheckCircle2 size={15} /> Fechamento salvo.
        </p>
      )}

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Vendas em dinheiro do dia</h2>
        <p className="font-numeric text-2xl font-semibold text-text-primary">{formatCurrency(salesCash)}</p>
        <p className="mt-1 text-xs text-text-muted">
          Calculado automaticamente pelo sistema (soma das vendas com pagamento em dinheiro nessa data).
        </p>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Conferência</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Troco inicial (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              onBlur={(e) => setOpening(parseCurrencyInput(e.target.value))}
              className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Valor contado no caixa (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              onBlur={(e) => setCounted(parseCurrencyInput(e.target.value))}
              className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col items-end gap-1 border-t border-border pt-4">
          <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
            <span>Esperado no caixa</span>
            <span className="font-numeric">{formatCurrency(expectedTotal)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-base font-semibold">
            <span className="text-text-primary">Diferença</span>
            <span className={`font-numeric ${diffLabel}`}>
              {difference > 0 ? "+" : ""}
              {formatCurrency(difference)}
            </span>
          </div>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Observações</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ex: sobrou troco de venda cancelada, etc."
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {alreadyClosed ? "Atualizar fechamento" : "Salvar fechamento"}
        </button>
      </div>
    </form>
  );
}
