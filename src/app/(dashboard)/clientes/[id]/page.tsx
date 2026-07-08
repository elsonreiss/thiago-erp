import Link from "next/link";
import { notFound } from "next/navigation";
import { NotebookText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PaymentMethodBadge } from "@/components/sales/PaymentMethodBadge";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const customer = await container.customerRepository.findById(Number(id));
  if (!customer) notFound();

  const sales = await container.saleRepository.findAll({ customerId: customer.id });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Editar cliente</h1>
        <p className="text-sm text-text-secondary">{customer.name}</p>
      </div>

      <CustomerForm customer={customer} />

      <Link
        href={`/notas-clientes/cliente/${customer.id}`}
        className="flex items-center gap-2 rounded-lg border border-border bg-accent-soft px-4 py-3 text-sm font-medium text-accent hover:opacity-80"
      >
        <NotebookText size={16} /> Ver notas de fiado deste cliente
      </Link>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Histórico de compras</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhuma compra registrada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sales.map((sale) => (
              <Link
                key={sale.id}
                href={`/vendas/${sale.id}`}
                className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0 hover:opacity-80"
              >
                <span className="text-text-secondary">{formatDateTime(sale.created_at)}</span>
                <PaymentMethodBadge method={sale.payment_method} />
                <span className="font-numeric font-medium text-text-primary">{formatCurrency(sale.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
