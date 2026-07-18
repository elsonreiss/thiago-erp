"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  ScanBarcode,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Product } from "@/domain/entities/Product";
import { Customer } from "@/domain/entities/Customer";
import { PaymentMethod, SaleWithItems } from "@/domain/entities/Sale";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/payment";
import { formatCurrency, formatDateTime, parseCurrencyInput, toCurrencyInputValue } from "@/lib/format";
import { Autocomplete } from "@/components/ui/Autocomplete";

interface CartLine {
  key: string;
  product: Product;
  quantity: number;
  unit_price: string; // formato de exibição ("0,00")
}

/**
 * Caixa rápido: fluxo de venda pensado pra ser operado quase só com o leitor
 * de código de barras — escaneia, confere o total e finaliza, sem os campos
 * extras (observações, item avulso etc.) da tela de "Nova venda" completa.
 */
export function QuickSaleForm({
  sellerName,
  storeName,
  companyDetail,
}: {
  sellerName: string;
  storeName: string;
  companyDetail: string | null;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState("0,00");
  const [scanValue, setScanValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<SaleWithItems | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const printPendingRef = useRef(false);

  useEffect(() => {
    if (printPendingRef.current && lastSale) {
      printPendingRef.current = false;
      const t = setTimeout(() => window.print(), 50);
      return () => clearTimeout(t);
    }
  }, [lastSale]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + parseFloat(l.unit_price || "0") * l.quantity, 0),
    [lines]
  );
  const discountValue = parseFloat(parseCurrencyInput(discount)) || 0;
  const total = Math.max(0, subtotal - discountValue);

  function addProduct(product: Product) {
    setSuccessMsg(null);
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
          unit_price: toCurrencyInputValue(product.sale_price),
        },
      ];
    });
  }

  async function handleScan(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanError(null);
    setScanning(true);
    try {
      const res = await fetch(`/api/products/lookup?code=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
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

  function updateQty(key: string, quantity: number) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l)));
  }

  function updatePrice(key: string, unit_price: string) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, unit_price } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function resetSale() {
    setLines([]);
    setCustomer(null);
    setDiscount("0,00");
    setPaymentMethod("dinheiro");
    setError(null);
    scanInputRef.current?.focus();
  }

  async function handleFinalize() {
    setError(null);
    if (lines.length === 0) {
      setError("Escaneie ao menos um item antes de finalizar.");
      return;
    }
    for (const line of lines) {
      if (line.quantity > line.product.quantity) {
        setError(`Estoque insuficiente para "${line.product.name}" (disponível: ${line.product.quantity}).`);
        return;
      }
    }
    if (paymentMethod === "fiado" && !customer) {
      setError("Selecione o cliente para registrar uma venda fiado.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: customer?.id ?? null,
        payment_method: paymentMethod,
        discount: parseCurrencyInput(discount),
        notes: null,
        items: lines.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
          unit_price: parseCurrencyInput(l.unit_price),
        })),
      };
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao registrar venda.");
        return;
      }
      setSuccessMsg(`Venda #${data.sale.id} registrada — ${formatCurrency(data.sale.total)}`);
      setLastSale(data.sale);
      printPendingRef.current = true;
      resetSale();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6 print:hidden">
        {successMsg && (
          <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 size={16} /> {successMsg}
          </p>
        )}
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="price-tag-card rounded-xl p-6">
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                <ScanBarcode size={17} className="text-accent" /> Leitor de código de barras
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={scanInputRef}
                  type="text"
                  autoFocus
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScan(scanValue);
                    }
                  }}
                  placeholder="Escaneie o produto..."
                  className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-base font-numeric text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                {scanning && <Loader2 size={18} className="animate-spin text-text-muted" />}
              </div>
              {scanError && <p className="mt-2 text-xs text-danger">{scanError}</p>}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-text-muted hover:text-text-primary">
                  Produto sem código de barras? Buscar por nome
                </summary>
                <div className="mt-2">
                  <Autocomplete<Product>
                    searchUrl="/api/products/autocomplete"
                    responseKey="products"
                    getKey={(p) => p.id}
                    getLabel={(p) => p.name}
                    getSubLabel={(p) => `${p.code} · estoque: ${p.quantity} ${p.unit} · ${formatCurrency(p.sale_price)}`}
                    onSelect={addProduct}
                    placeholder="Buscar produto por nome ou código..."
                  />
                </div>
              </details>
            </div>

            <div className="price-tag-card rounded-xl p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text-primary">
                <ShoppingCart size={17} /> Itens ({lines.length})
              </h2>

              {lines.length === 0 ? (
                <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-sm text-text-muted">
                  <Barcode size={16} /> Escaneie o primeiro produto pra começar a venda.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {lines.map((line) => {
                    const lineSubtotal = parseFloat(line.unit_price || "0") * line.quantity;
                    const overStock = line.quantity > line.product.quantity;
                    return (
                      <div
                        key={line.key}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-text-primary">{line.product.name}</p>
                          <p className="text-xs text-text-muted">
                            {line.product.code} · estoque: {line.product.quantity} {line.product.unit}
                          </p>
                          {overStock && (
                            <p className="text-xs font-medium text-danger">Quantidade maior que o estoque!</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(line.key, line.quantity - 1)}
                            className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-bg-secondary"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => updateQty(line.key, Number(e.target.value) || 1)}
                            className="w-14 rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-center font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(line.key, line.quantity + 1)}
                            className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-bg-secondary"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={line.unit_price}
                          onChange={(e) => updatePrice(line.key, e.target.value)}
                          onBlur={(e) => updatePrice(line.key, toCurrencyInputValue(parseCurrencyInput(e.target.value)))}
                          className="w-24 rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-right font-numeric focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />

                        <span className="w-24 shrink-0 text-right font-numeric font-medium text-text-primary">
                          {formatCurrency(lineSubtotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger"
                          aria-label="Remover item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <div className="price-tag-card rounded-xl p-6">
              <p className="mb-3 flex items-center gap-1.5 text-xs text-text-muted">
                <User size={14} /> Vendedor: <span className="font-medium text-text-primary">{sellerName}</span>
              </p>

              <label className="mb-2 block text-sm font-semibold text-text-primary">Forma de pagamento</label>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                      paymentMethod === m
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                ))}
              </div>

              {paymentMethod === "fiado" && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">Cliente (obrigatório p/ fiado)</label>
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
                      placeholder="Buscar cliente..."
                    />
                  )}
                </div>
              )}

              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Desconto (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                onBlur={(e) => setDiscount(toCurrencyInputValue(parseCurrencyInput(e.target.value)))}
                className="mb-4 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-numeric text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-numeric">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Desconto</span>
                  <span className="font-numeric">-{formatCurrency(discountValue)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-text-primary">
                  <span>Total</span>
                  <span className="font-numeric">{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalize}
                disabled={saving || lines.length === 0}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Registrando..." : "Finalizar venda"}
              </button>
              <button
                type="button"
                onClick={resetSale}
                disabled={saving || (lines.length === 0 && !customer)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-muted hover:bg-bg-secondary disabled:opacity-40"
              >
                <RotateCcw size={13} /> Limpar venda atual
              </button>
            </div>
          </div>
        </div>
      </div>

      {lastSale && <QuickReceipt80 sale={lastSale} storeName={storeName} companyDetail={companyDetail} />}
    </>
  );
}

/** Cupom térmico 80mm da última venda finalizada no caixa rápido — impresso automaticamente. */
function QuickReceipt80({
  sale,
  storeName,
  companyDetail,
}: {
  sale: SaleWithItems;
  storeName: string;
  companyDetail: string | null;
}) {
  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const discount = parseFloat(sale.discount);

  return (
    <div className="hidden print:block">
      <style>{`@page { size: 80mm auto; margin: 0; }`}</style>
      <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-[11px] text-black">
        <div className="text-center leading-tight">
          <p className="font-bold uppercase">{storeName}</p>
          {companyDetail && <p>{companyDetail}</p>}
          <p>Comprovante de venda</p>
          <p>{formatDateTime(sale.created_at)}</p>
        </div>
        <div className="my-1 border-t border-dashed border-black" />
        <p>Cliente: {sale.customer_name ?? "Consumidor final"}</p>
        <p>Vendedor: {sale.seller_name}</p>
        <p>Pagto: {PAYMENT_METHOD_LABELS[sale.payment_method]}</p>
        <div className="my-1 border-t border-dashed border-black" />
        {sale.items.map((item) => (
          <div key={item.id} className="mb-1 leading-tight">
            <p>{item.product_name}</p>
            <div className="flex justify-between">
              <span>
                {item.quantity} x {formatCurrency(item.unit_price)}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
        <div className="my-1 border-t border-dashed border-black" />
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Desconto</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div className="my-1 border-t border-dashed border-black" />
        <p className="text-center leading-tight">Obrigado pela preferência!</p>
        <p className="text-center text-[9px] leading-tight">Documento sem valor fiscal</p>
      </div>
    </div>
  );
}
