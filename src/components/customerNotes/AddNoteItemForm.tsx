"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Product } from "@/domain/entities/Product";
import { formatCurrency, parseCurrencyInput } from "@/lib/format";
import { Autocomplete } from "@/components/ui/Autocomplete";

export function AddNoteItemForm({ noteId }: { noteId: number }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("0,00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectProduct(p: Product) {
    setProduct(p);
    setUnitPrice(p.sale_price);
    setQuantity(1);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!product) {
      setError("Escolha um produto.");
      return;
    }
    if (quantity > product.quantity) {
      setError(`Estoque insuficiente para "${product.name}" (disponível: ${product.quantity}).`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/customer-notes/${noteId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          unit_price: parseCurrencyInput(unitPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao adicionar item.");
        return;
      }
      setProduct(null);
      setQuantity(1);
      setUnitPrice("0,00");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-bg-secondary p-4">
      <p className="text-sm font-medium text-text-primary">Adicionar item (nova compra nesta nota)</p>
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {product ? (
        <div className="flex flex-wrap items-end gap-3">
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
        </div>
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
    </form>
  );
}
