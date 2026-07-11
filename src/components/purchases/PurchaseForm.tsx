"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus, Plus, Trash2, User, X } from "lucide-react";
import { Product } from "@/domain/entities/Product";
import { Supplier } from "@/domain/entities/Supplier";
import { formatCurrency, parseCurrencyInput, toCurrencyInputValue } from "@/lib/format";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { QuickCreateProductModal } from "@/components/products/QuickCreateProductModal";

interface CartLine {
  key: string;
  product: Product;
  quantity: number;
  unit_price: string;
}

export function PurchaseForm({ userName }: { userName: string }) {
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + parseFloat(line.unit_price || "0") * line.quantity, 0),
    [lines]
  );

  function addProduct(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          key: `${product.id}-${Date.now()}`,
          product,
          quantity: 1,
          unit_price: toCurrencyInputValue(product.purchase_price),
        },
      ];
    });
  }

  function updateLine(key: string, patch: Partial<CartLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Adicione ao menos um item à compra.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplier_id: supplier?.id ?? null,
        notes: notes.trim() || null,
        items: lines.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
          unit_price: parseCurrencyInput(l.unit_price),
        })),
      };
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao registrar compra.");
        return;
      }
      router.push(`/compras/${data.purchase.id}`);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Registrado por</h2>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary">
          <User size={15} className="text-text-muted" />
          {userName}
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Fornecedor (opcional)</h2>
        {supplier ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm">
            <span className="text-text-primary">{supplier.name}</span>
            <button
              type="button"
              onClick={() => setSupplier(null)}
              className="text-text-muted hover:text-danger"
              aria-label="Remover fornecedor"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <Autocomplete<Supplier>
            searchUrl="/api/suppliers/autocomplete"
            responseKey="suppliers"
            getKey={(s) => s.id}
            getLabel={(s) => s.name}
            getSubLabel={(s) => s.cnpj || s.city || ""}
            onSelect={setSupplier}
            placeholder="Buscar fornecedor por nome ou CNPJ..."
          />
        )}
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-text-primary">Itens</h2>
          <button
            type="button"
            onClick={() => setShowQuickCreate(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft"
          >
            <Plus size={14} /> Produto não cadastrado ainda?
          </button>
        </div>
        <Autocomplete<Product>
          searchUrl="/api/products/autocomplete"
          responseKey="products"
          getKey={(p) => p.id}
          getLabel={(p) => p.name}
          getSubLabel={(p) => `${p.code} · estoque atual: ${p.quantity} ${p.unit} · custo: ${formatCurrency(p.purchase_price)}`}
          onSelect={addProduct}
          placeholder="Buscar produto por nome ou código..."
        />

        {lines.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-text-muted">
            <PackagePlus size={16} /> Nenhum item adicionado ainda.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted">
                  <th className="py-2 pr-3 font-medium">Produto</th>
                  <th className="py-2 pr-3 font-medium text-right">Qtd.</th>
                  <th className="py-2 pr-3 font-medium text-right">Preço unit. (R$)</th>
                  <th className="py-2 pr-3 font-medium text-right">Subtotal</th>
                  <th className="py-2 pr-3 font-medium text-right">-</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const lineSubtotal = parseFloat(line.unit_price || "0") * line.quantity;
                  return (
                    <tr key={line.key} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3">
                        <p className="text-text-primary">{line.product.name}</p>
                        <p className="text-xs text-text-muted">
                          {line.product.code} · estoque atual: {line.product.quantity} {line.product.unit}
                        </p>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.key, { quantity: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className="w-20 rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-right font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.key, { unit_price: e.target.value })}
                          onBlur={(e) =>
                            updateLine(line.key, { unit_price: parseCurrencyInput(e.target.value) })
                          }
                          className="w-28 rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-right font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right font-numeric text-text-primary">
                        {formatCurrency(lineSubtotal)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <div className="mb-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Observações</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
        </div>
        <div className="flex flex-col items-end gap-1 border-t border-border pt-4">
          <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
            <span>Total da compra</span>
            <span className="font-numeric">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/compras")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || lines.length === 0}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Registrando..." : "Registrar compra"}
        </button>
      </div>

      {showQuickCreate && (
        <QuickCreateProductModal
          supplierId={supplier?.id ?? null}
          onCreated={(product) => {
            addProduct(product);
            setShowQuickCreate(false);
          }}
          onClose={() => setShowQuickCreate(false)}
        />
      )}
    </form>
  );
}
