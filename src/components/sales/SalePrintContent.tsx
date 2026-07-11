"use client";

import Image from "next/image";
import { useSalePrint } from "@/components/sales/SalePrintContext";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

/**
 * Conteúdo de impressão escondido na tela ("hidden print:block"), que só
 * aparece na hora de imprimir. Renderiza o formato A4 (rico, com logo e
 * tabela) ou o cupom térmico 80mm, de acordo com o botão clicado em
 * <SalePrintButtons />. Só um dos dois fica montado por vez, pra não ter
 * duas regras @page conflitando.
 */
export function SalePrintContent() {
  const { mode, sale, storeName } = useSalePrint();
  if (!mode) return null;

  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const discount = parseFloat(sale.discount);

  if (mode === "a4") {
    return (
      <div className="hidden print:block">
        <style>{`@page { size: A4; margin: 15mm; }`}</style>
        <div className="mx-auto w-full max-w-2xl bg-white p-0 text-black">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={56} height={56} className="h-14 w-14 object-contain" />
              <div>
                <p className="font-display text-lg font-bold">{storeName}</p>
                <p className="text-sm text-gray-600">Comprovante de venda</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Emitido em</p>
              <p className="text-sm">{formatDateTime(sale.created_at)}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="font-medium">{sale.customer_name ?? "Consumidor final"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vendedor</p>
              <p className="font-medium">{sale.seller_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Forma de pagamento</p>
              <p className="font-medium">{PAYMENT_METHOD_LABELS[sale.payment_method]}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-gray-500">
                <th className="py-2 pr-2 font-medium">Produto</th>
                <th className="py-2 pr-2 font-medium text-right">Qtd.</th>
                <th className="py-2 pr-2 font-medium text-right">Preço unit.</th>
                <th className="py-2 pr-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-2">{item.product_name}</td>
                  <td className="py-2 pr-2 text-right">{item.quantity}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4">
            <div className="flex w-full max-w-xs justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex w-full max-w-xs justify-between text-sm text-gray-600">
                <span>Desconto</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex w-full max-w-xs justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-1 text-xs font-medium text-gray-500">Observações</p>
              <p className="text-sm text-gray-600">{sale.notes}</p>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-gray-500">Obrigado pela preferência!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden print:block">
      <style>{`@page { size: 80mm auto; margin: 0; }`}</style>
      <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-[11px] text-black">
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
    </div>
  );
}
