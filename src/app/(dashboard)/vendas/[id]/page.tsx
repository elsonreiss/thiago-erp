import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PaymentMethodBadge } from "@/components/sales/PaymentMethodBadge";
import { DeleteSaleButton } from "@/components/sales/DeleteSaleButton";
import { canViewFinancials, isAdmin } from "@/domain/entities/User";

type Params = { params: Promise<{ id: string }> };

export default async function VendaDetalhePage({ params }: Params) {
  const user = await requireUser();
  const { id } = await params;

  const sale = await container.saleRepository.findById(Number(id));
  if (!sale) notFound();

  if (!canViewFinancials(user.role) && sale.user_id !== user.id) {
    notFound();
  }

  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/vendas"
            className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Venda #{sale.id}</h1>
            <p className="text-sm text-text-secondary">{formatDateTime(sale.created_at)}</p>
          </div>
        </div>
        {isAdmin(user.role) && <DeleteSaleButton id={sale.id} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Cliente</p>
          <p className="mt-1 font-medium text-text-primary">{sale.customer_name ?? "Consumidor final"}</p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Vendedor</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium text-text-primary">
            <User size={14} className="text-text-muted" /> {sale.seller_name}
          </p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Pagamento</p>
          <div className="mt-1.5">
            <PaymentMethodBadge method={sale.payment_method} />
          </div>
        </div>
      </div>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium text-right">Qtd.</th>
              <th className="px-4 py-3 font-medium text-right">Preço unit.</th>
              <th className="px-4 py-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-primary">{item.product_name}</td>
                <td className="px-4 py-3 text-right font-numeric">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col items-end gap-1 border-t border-border p-4">
          <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
            <span>Subtotal</span>
            <span className="font-numeric">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
            <span>Desconto</span>
            <span className="font-numeric">-{formatCurrency(sale.discount)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
            <span>Total</span>
            <span className="font-numeric">{formatCurrency(sale.total)}</span>
          </div>
        </div>
      </div>

      {sale.notes && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-2 font-display text-base font-semibold text-text-primary">Observações</h2>
          <p className="text-sm text-text-secondary">{sale.notes}</p>
        </div>
      )}
    </div>
  );
}
