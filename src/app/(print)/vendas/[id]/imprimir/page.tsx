import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";
import { PrintButton } from "@/components/budgets/PrintButton";

type Params = { params: Promise<{ id: string }> };

export default async function ImprimirVendaPage({ params }: Params) {
  const { id } = await params;

  const sale = await container.saleRepository.findById(Number(id));
  if (!sale) notFound();

  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const discount = parseFloat(sale.discount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/vendas/${sale.id}`}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-surface p-8 print:border-none print:p-0 print:shadow-none">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
            <div>
              <p className="font-display text-lg font-bold text-text-primary">Thiago Casa &amp; Construção</p>
              <p className="text-sm text-text-secondary">Comprovante de venda</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Venda #{sale.id}</p>
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
    </div>
  );
}
