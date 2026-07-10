"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Loader2, NotebookPen, PackagePlus, Trash2, User, X } from "lucide-react";
import { Product } from "@/domain/entities/Product";
import { Customer } from "@/domain/entities/Customer";
import { formatCurrency, parseCurrencyInput } from "@/lib/format";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { ManualItemForm } from "@/components/ui/ManualItemForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CartLine {
  key: string;
  product: Product | null;
  manualName: string;
  quantity: number;
  unit_price: string;
}

export function CustomerNoteForm({ sellerName }: { sellerName: string }) {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + parseFloat(line.unit_price || "0") * line.quantity, 0),
    [lines]
  );

  function addProduct(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product?.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product?.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          key: `${product.id}-${Date.now()}`,
          product,
          manualName: "",
          quantity: 1,
          unit_price: product.sale_price,
        },
      ];
    });
  }

  function addManualItem(name: string, quantity: number, unitPrice: string) {
    setLines((prev) => [
      ...prev,
      { key: `manual-${Date.now()}`, product: null, manualName: name, quantity, unit_price: unitPrice },
    ]);
    setShowManual(false);
  }

  async function handleScan(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanError(null);
    setScanning(true);
    try {
      const res = await fetch(`/api/products/lookup?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error ?? "Produto não encontrado.");
        return;
      }
      addProduct(data.product);
      setScanValue("");
    } catch {
      setScanError("Erro de conexão ao buscar produto.");
    } finally {
      setScanning(false);
      scanInputRef.current?.focus();
    }
  }

  function updateLine(key: string, patch: Partial<CartLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  async function submitNote(overrideLimit: boolean) {
    setSaving(true);
    try {
      const payload = {
        customer_id: customer!.id,
        description: description.trim() || null,
        due_date: dueDate || null,
        items: lines.map((l) => ({
          product_id: l.product?.id ?? null,
          product_name: l.product ? undefined : l.manualName,
          quantity: l.quantity,
          unit_price: parseCurrencyInput(l.unit_price),
        })),
        override_limit: overrideLimit,
      };
      const res = await fetch("/api/customer-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "CREDIT_LIMIT_EXCEEDED") {
          setLimitWarning(data.error);
          return;
        }
        setError(data.error ?? "Erro ao registrar nota.");
        return;
      }
      router.push(`/notas-clientes/${data.note.id}`);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!customer) {
      setError("Selecione o cliente da nota.");
      return;
    }
    if (lines.length === 0) {
      setError("Adicione ao menos um item à nota.");
      return;
    }
    for (const line of lines) {
      if (line.product && line.quantity > line.product.quantity) {
        setError(`Estoque insuficiente para "${line.product.name}" (disponível: ${line.product.quantity}).`);
        return;
      }
    }

    await submitNote(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <ConfirmDialog
        open={!!limitWarning}
        title="Limite de crédito excedido"
        message={limitWarning ?? ""}
        confirmLabel="Registrar mesmo assim"
        loading={saving}
        onConfirm={() => submitNote(true)}
        onCancel={() => setLimitWarning(null)}
      />

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Vendedor</h2>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary">
          <User size={15} className="text-text-muted" />
          {sellerName}
          <span className="ml-auto text-xs text-text-muted">nota registrada em seu nome</span>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Cliente *</h2>
        {customer ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm">
            <span className="text-text-primary">{customer.name}</span>
            <button
              type="button"
              onClick={() => setCustomer(null)}
              className="text-text-muted hover:text-danger"
              aria-label="Remover cliente"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <Autocomplete<Customer>
            searchUrl="/api/customers/autocomplete"
            responseKey="customers"
            getKey={(c) => c.id}
            getLabel={(c) => c.name}
            getSubLabel={(c) => c.phone || c.document || ""}
            onSelect={setCustomer}
            placeholder="Buscar cliente por nome, telefone ou documento..."
          />
        )}
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-text-primary">Itens levados</h2>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-secondary"
          >
            <PackagePlus size={14} /> Item avulso (sem cadastro)
          </button>
        </div>

        <div className="mb-3 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            <Barcode size={14} /> Leitor de código de barras
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={scanInputRef}
              type="text"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScan(scanValue);
                }
              }}
              placeholder="Escaneie ou digite o código e aperte Enter..."
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-numeric text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {scanning && <Loader2 size={16} className="animate-spin text-text-muted" />}
          </div>
          {scanError && <p className="text-xs text-danger">{scanError}</p>}
        </div>

        <Autocomplete<Product>
          searchUrl="/api/products/autocomplete"
          responseKey="products"
          getKey={(p) => p.id}
          getLabel={(p) => p.name}
          getSubLabel={(p) => `${p.code} · estoque: ${p.quantity} ${p.unit} · ${formatCurrency(p.sale_price)}`}
          onSelect={addProduct}
          placeholder="Buscar produto por nome ou código..."
        />

        {showManual && (
          <div className="mt-3">
            <ManualItemForm onAdd={addManualItem} onCancel={() => setShowManual(false)} />
          </div>
        )}

        {lines.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-text-muted">
            <NotebookPen size={16} /> Nenhum item adicionado ainda.
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
                  const overStock = !!line.product && line.quantity > line.product.quantity;
                  return (
                    <tr key={line.key} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3">
                        <p className="text-text-primary">
                          {line.product ? line.product.name : line.manualName}
                          {!line.product && (
                            <span className="ml-2 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                              avulso
                            </span>
                          )}
                        </p>
                        {line.product && (
                          <p className="text-xs text-text-muted">
                            {line.product.code} · estoque: {line.product.quantity} {line.product.unit}
                          </p>
                        )}
                        {overStock && (
                          <p className="text-xs font-medium text-danger">Quantidade maior que o estoque!</p>
                        )}
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
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Observações</h2>
        <div className="mb-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Data de vencimento (opcional)</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Ex: cliente disse que paga no fim do mês..."
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <div className="mt-5 flex flex-col items-end gap-1 border-t border-border pt-4">
          <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
            <span>Total da nota</span>
            <span className="font-numeric">{formatCurrency(total)}</span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Os itens saem do estoque agora. O valor só entra no financeiro quando a nota for marcada como paga.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/notas-clientes")}
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
          {saving ? "Registrando..." : "Registrar nota"}
        </button>
      </div>
    </form>
  );
}
