import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export default async function CompraDetalhePage({ params }: Params) {
  await requireUser();
  const { id } = await params;

  const purchase = await container.purchaseRepository.findById(Number(id));
  if (!purchase) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/compras"
          className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Compra #{purchase.id}</h1>
          <p className="text-sm text-text-secondary">{formatDateTime(purchase.created_at)}</p>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-5">
        <p className="text-xs text-text-muted">Fornecedor</p>
        <p className="mt-1 font-medium text-text-primary">{purchase.supplier_name ?? "Não informado"}</p>
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
            {purchase.items.map((item) => (
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
          <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
            <span>Total</span>
            <span className="font-numeric">{formatCurrency(purchase.total)}</span>
          </div>
        </div>
      </div>

      {purchase.notes && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-2 font-display text-base font-semibold text-text-primary">Observações</h2>
          <p className="text-sm text-text-secondary">{purchase.notes}</p>
        </div>
      )}
    </div>
  );
}
