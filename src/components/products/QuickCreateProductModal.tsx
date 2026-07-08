"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { DEFAULT_PRODUCT_CATEGORIES, PRODUCT_UNITS, Product } from "@/domain/entities/Product";
import { parseCurrencyInput } from "@/lib/format";

/**
 * Cadastro rápido de produto, usado direto na tela de Compras: quando o
 * fornecedor entrega um item que ainda não existe no estoque, dá pra
 * cadastrá-lo sem sair da nota de compra que está sendo lançada.
 */
export function QuickCreateProductModal({
  supplierId,
  onCreated,
  onClose,
}: {
  supplierId?: number | null;
  onCreated: (product: Product) => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      code: String(form.get("code") ?? "").trim(),
      barcode: null,
      name: String(form.get("name") ?? "").trim(),
      category: String(form.get("category") ?? "Outros"),
      brand: null,
      unit: String(form.get("unit") ?? "UN"),
      description: null,
      photo: null,
      purchase_price: parseCurrencyInput(String(form.get("purchase_price") ?? "0")),
      sale_price: parseCurrencyInput(String(form.get("sale_price") ?? "0")),
      min_stock: Number(form.get("min_stock") ?? 0),
      quantity: 0,
      location: null,
      supplier_id: supplierId ?? null,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar produto.");
        return;
      }
      onCreated(data.product as Product);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="price-tag-card w-full max-w-lg rounded-xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-text-primary">
            Cadastrar produto rapidamente
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-text-secondary">
          Preencha só o essencial agora. Você pode completar os detalhes depois em Estoque.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Código *</span>
              <input name="code" required autoFocus className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Nome *</span>
              <input name="name" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Categoria *</span>
              <select name="category" required defaultValue={DEFAULT_PRODUCT_CATEGORIES[0]} className={inputClass}>
                {DEFAULT_PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Unidade *</span>
              <select name="unit" required defaultValue="UN" className={inputClass}>
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Preço de compra (R$)</span>
              <input name="purchase_price" type="text" inputMode="decimal" defaultValue="0,00" className={`${inputClass} font-numeric`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Preço de venda (R$) *</span>
              <input name="sale_price" type="text" inputMode="decimal" required defaultValue="0,00" className={`${inputClass} font-numeric`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Estoque mínimo</span>
              <input name="min_stock" type="number" min={0} defaultValue={0} className={`${inputClass} font-numeric`} />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Cadastrando..." : "Cadastrar e adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
