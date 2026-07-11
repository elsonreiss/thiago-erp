"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { formatCurrency, parseCurrencyInput, toCurrencyInputValue } from "@/lib/format";

interface ManualItemFormProps {
  onAdd: (name: string, quantity: number, unitPrice: string) => void;
  onCancel: () => void;
}

/** Formulário compacto pra adicionar um item "avulso": um produto digitado na hora, sem cadastro no estoque. */
export function ManualItemForm({ onAdd, onCancel }: ManualItemFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("0,00");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!name.trim()) {
      setError("Digite o nome do item.");
      return;
    }
    onAdd(name.trim(), quantity, parseCurrencyInput(unitPrice));
    setName("");
    setQuantity(1);
    setUnitPrice("0,00");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-bg-secondary p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-primary">Item avulso (produto sem cadastro)</p>
        <button type="button" onClick={onCancel} className="text-text-muted hover:text-danger" aria-label="Fechar">
          <X size={15} />
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Nome do item</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Parafuso avulso, serviço, etc."
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Qtd.</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Preço unit. (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            onBlur={(e) => setUnitPrice(toCurrencyInputValue(parseCurrencyInput(e.target.value)))}
            className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <p className="text-sm text-text-secondary">
          Subtotal:{" "}
          <span className="font-numeric font-medium text-text-primary">
            {formatCurrency(parseFloat(parseCurrencyInput(unitPrice)) * quantity)}
          </span>
        </p>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>
    </div>
  );
}
