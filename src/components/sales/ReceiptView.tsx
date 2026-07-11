"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { SaleWithItems } from "@/domain/entities/Sale";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

type Format = "a4" | "58" | "80";

export function ReceiptView({
  sale,
  storeName = "Thiago Casa & Construção",
  initialFormat = "a4",
  autoPrint = false,
}: {
  sale: SaleWithItems;
  storeName?: string;
  initialFormat?: Format;
  autoPrint?: boolean;
}) {
  const [format, setFormat] = useState<Format>(initialFormat);
  const pendingPrintRef = useRef(false);
  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const discount = parseFloat(sale.discount);

  // Dispara a impressão automaticamente quando a página é aberta com ?autoprint=1
  // (usado pelo botão "Imprimir Cupom 80mm" na tela da venda).
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  // Depois de trocar de formato via botão "Imprimir Cupom 80mm", espera o @page
  // aplicar o novo tamanho de página antes de abrir o diálogo de impressão.
  // Usa ref (em vez de state) porque isso não deve disparar um re-render por si só.
  useEffect(() => {
    if (pendingPrintRef.current) {
      pendingPrintRef.current = false;
      const t = setTimeout(() => window.print(), 50);
      return () => clearTimeout(t);
    }
  }, [format]);

  function quickPrint80() {
    pendingPrintRef.current = true;
    setFormat("80");
  }

  const pageSize =
    format === "58" ? "58mm auto" : format === "80" ? "80mm auto" : "A4";
  const pageMargin = format === "a4" ? "15mm" : "0";

  return (
    <div className="flex flex-col gap-6">
      <style>{`@page { size: ${pageSize}; margin: ${pageMargin}; }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/vendas/${sale.id}`}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <FormatButton active={format === "a4"} onClick={() => setFormat("a4")} label="A4 / PDF" />
          <FormatButton active={format === "58"} onClick={() => setFormat("58")} label="Cupom 58mm" />
          <FormatButton active={format === "80"} onClick={() => setFormat("80")} label="Cupom 80mm" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={quickPrint80}
            className="flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent-soft"
          >
            <Printer size={16} /> Imprimir Cupom 80mm
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            <Printer size={16} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {format === "a4" ? (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-8 print:border-none print:p-0 print:shadow-none">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={56} height={56} className="h-14 w-14 object-contain" />
              <div>
                <p className="font-display text-lg font-bold text-text-primary">{storeName}</p>
                <p className="text-sm text-text-secondary">Comprovante de venda</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Emitido em</p>
              <p className="text-sm text-text-primary">{formatDateTime(sale.created_at)}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-muted">Cliente</p>
              <p className="font-medium text-text-primary">{sale.customer_name ?? "Consumidor final"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Vendedor</p>
              <p className="font-medium text-text-primary">{sale.seller_name}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Forma de pagamento</p>
              <p className="font-medium text-text-primary">{PAYMENT_METHOD_LABELS[sale.payment_method]}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="py-2 pr-2 font-medium">Produto</th>
                <th className="py-2 pr-2 font-medium text-right">Qtd.</th>
                <th className="py-2 pr-2 font-medium text-right">Preço unit.</th>
                <th className="py-2 pr-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-2 text-text-primary">{item.product_name}</td>
                  <td className="py-2 pr-2 text-right font-numeric">{item.quantity}</td>
                  <td className="py-2 pr-2 text-right font-numeric">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2 pr-2 text-right font-numeric">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4">
            <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
              <span>Subtotal</span>
              <span className="font-numeric">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
                <span>Desconto</span>
                <span className="font-numeric">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
              <span>Total</span>
              <span className="font-numeric">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-1 text-xs font-medium text-text-muted">Observações</p>
              <p className="text-sm text-text-secondary">{sale.notes}</p>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-text-muted">Obrigado pela preferência!</p>
        </div>
      ) : (
        <div
          className={`mx-auto bg-white p-2 font-mono text-black ${format === "58" ? "w-[58mm] text-[10px]" : "w-[80mm] text-[11px]"}`}
        >
          <div className="text-center leading-tight">
            <p className="font-bold uppercase">{storeName}</p>
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
          {sale.notes && (
            <>
              <div className="my-1 border-t border-dashed border-black" />
              <p className="leading-tight">Obs: {sale.notes}</p>
            </>
          )}
          <div className="my-1 border-t border-dashed border-black" />
          <p className="text-center leading-tight">Obrigado pela preferência!</p>
        </div>
      )}
    </div>
  );
}

function FormatButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
        active ? "bg-accent text-accent-foreground" : "text-text-secondary hover:bg-bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}
