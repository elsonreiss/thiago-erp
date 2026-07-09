"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus, Plus } from "lucide-react";
import { Product } from "@/domain/entities/Product";
import { formatCurrency, parseCurrencyInput } from "@/lib/format";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { ManualItemForm } from "@/components/ui/ManualItemForm";

export function AddNoteItemForm({ noteId }: { noteId: number }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("0,00");
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectProduct(p: Product) {
    setProduct(p);
    setUnitPrice(p.sale_price);
    setQuantity(1);
  }

  async function submitItem(payload: { product_id: number | null; product_name?: string; quantity: number; unit_price: string }) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/customer-notes/${noteId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao adicionar item.");
        return;
      }
      setProduct(null);
      setQuantity(1);
      setUnitPrice("0,00");
      setShowManual(false);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) {
      setError("Escolha um produto.");
      return;
    }
    if (quantity > product.quantity) {
      setError(`Estoque insuficiente para "${product.name}" (disponível: ${product.quantity}).`);
      return;
    }
    await submitItem({
      product_id: product.id,
      quantity,
      unit_price: parseCurrencyInput(unitPrice),
    });
  }

  function handleManualAdd(name: string, qty: number, price: string) {
    submitItem({ product_id: null, product_name: name, quantity: qty, unit_price: price });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-secondary p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-text-primary">Adicionar item (nova compra nesta nota)</p>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface"
          >
            <PackagePlus size={14} /> Item avulso (sem cadastro)
          </button>
        </div>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        {product ? (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <p className="text-text-primary">{product.name}</p>
              <p className="text-xs text-text-muted">
                {product.code} · estoque: {product.quantity} {product.unit}
              </p>
            </div>
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
                onBlur={(e) => setUnitPrice(parseCurrencyInput(e.target.value))}
                className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </label>
            <p className="text-sm text-text-secondary">
              Subtotal: <span className="font-numeric font-medium text-text-primary">{formatCurrency(parseFloat(parseCurrencyInput(unitPrice)) * quantity)}</span>
            </p>
            <button
              type="button"
              onClick={() => setProduct(null)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-bg-tertiary"
            >
              Trocar produto
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Adicionar
            </button>
          </form>
        ) : (
          <Autocomplete<Product>
            searchUrl="/api/products/autocomplete"
            responseKey="products"
            getKey={(p) => p.id}
            getLabel={(p) => p.name}
            getSubLabel={(p) => `${p.code} · estoque: ${p.quantity} ${p.unit} · ${formatCurrency(p.sale_price)}`}
            onSelect={selectProduct}
            placeholder="Buscar produto por nome ou código..."
          />
        )}
      </div>

      {showManual && <ManualItemForm onAdd={handleManualAdd} onCancel={() => setShowManual(false)} />}
    </div>
  );
}
