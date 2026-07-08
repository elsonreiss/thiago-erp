"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/domain/entities/Expense";
import { parseCurrencyInput } from "@/lib/format";

export function ExpenseForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      description: String(form.get("description") ?? "").trim(),
      category: String(form.get("category") ?? "Outros"),
      amount: parseCurrencyInput(String(form.get("amount") ?? "0")),
      expense_date: String(form.get("expense_date") ?? ""),
      notes: (String(form.get("notes") ?? "").trim() || null),
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao registrar despesa.");
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="text-sm font-medium text-text-primary">Descrição *</span>
          <input name="description" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Categoria *</span>
          <select name="category" required defaultValue={DEFAULT_EXPENSE_CATEGORIES[0]} className={inputClass}>
            {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Valor (R$) *</span>
          <input
            name="amount"
            type="text"
            inputMode="decimal"
            required
            defaultValue="0,00"
            className={`${inputClass} font-numeric`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Data *</span>
          <input name="expense_date" type="date" required defaultValue={today} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
          <span className="text-sm font-medium text-text-primary">Observações</span>
          <input name="notes" className={inputClass} />
        </label>
      </div>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {saving ? "Salvando..." : "Lançar despesa"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
