import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt, ShoppingCart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CustomerNoteStatusBadge } from "@/components/customerNotes/CustomerNoteStatusBadge";
import { RegisterPaymentForm } from "@/components/customerNotes/RegisterPaymentForm";
import { DeleteNoteButton } from "@/components/customerNotes/DeleteNoteButton";
import { AddNoteItemForm } from "@/components/customerNotes/AddNoteItemForm";
import { RemoveNoteItemButton } from "@/components/customerNotes/RemoveNoteItemButton";
import { PaymentMethodBadge } from "@/components/sales/PaymentMethodBadge";
import { isAdmin } from "@/domain/entities/User";

type Params = { params: Promise<{ id: string }> };

export default async function NotaClienteDetalhePage({ params }: Params) {
  const user = await requireUser();
  const { id } = await params;

  const note = await container.customerNoteRepository.findById(Number(id));
  if (!note) notFound();

  const remaining = Math.max(0, parseFloat(note.total) - parseFloat(note.paid_amount));
  const editable = note.status !== "pago";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/notas-clientes"
            className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Nota de cliente</h1>
            <p className="text-sm text-text-secondary">{formatDateTime(note.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/notas-clientes/cliente/${note.customer_id}`}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <Receipt size={16} /> Ver extrato do cliente
          </Link>
          {isAdmin(user.role) && editable && <DeleteNoteButton id={note.id} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Cliente</p>
          <p className="mt-1 font-medium text-text-primary">{note.customer_name}</p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Vendedor</p>
          <p className="mt-1 font-medium text-text-primary">{note.seller_name}</p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Status</p>
          <div className="mt-1.5">
            <CustomerNoteStatusBadge status={note.status} />
          </div>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Saldo devedor</p>
          <p className="mt-1 font-numeric font-semibold text-danger">{formatCurrency(remaining)}</p>
        </div>
      </div>

      {note.sale_id && (
        <Link
          href={`/vendas/${note.sale_id}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-accent-soft px-4 py-3 text-sm font-medium text-accent hover:opacity-80"
        >
          <ShoppingCart size={16} /> Ver venda gerada a partir desta nota
        </Link>
      )}

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Adicionado em</th>
              <th className="px-4 py-3 font-medium text-right">Qtd.</th>
              <th className="px-4 py-3 font-medium text-right">Preço unit.</th>
              <th className="px-4 py-3 font-medium text-right">Subtotal</th>
              {editable && <th className="px-4 py-3 font-medium text-right">-</th>}
            </tr>
          </thead>
          <tbody>
            {note.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-primary">{item.product_name}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(item.created_at)}</td>
                <td className="px-4 py-3 text-right font-numeric">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.subtotal)}</td>
                {editable && (
                  <td className="px-4 py-3 text-right">
                    <RemoveNoteItemButton noteId={note.id} itemId={item.id} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col items-end gap-1 border-t border-border p-4">
          <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
            <span>Total</span>
            <span className="font-numeric">{formatCurrency(note.total)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
            <span>Pago até agora</span>
            <span className="font-numeric">{formatCurrency(note.paid_amount)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
            <span>Saldo devedor</span>
            <span className="font-numeric">{formatCurrency(remaining)}</span>
          </div>
        </div>
      </div>

      {editable && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Nova compra nesta nota</h2>
          <AddNoteItemForm noteId={note.id} />
        </div>
      )}

      {note.description && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-2 font-display text-base font-semibold text-text-primary">Observações</h2>
          <p className="text-sm text-text-secondary">{note.description}</p>
        </div>
      )}

      {editable && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Pagamento</h2>
          <RegisterPaymentForm noteId={note.id} remaining={remaining} />
        </div>
      )}

      {note.payments.length > 0 && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Histórico de pagamentos</h2>
          <div className="flex flex-col gap-2">
            {note.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0"
              >
                <span className="text-text-secondary">{formatDateTime(payment.created_at)}</span>
                <PaymentMethodBadge method={payment.payment_method} />
                <span className="font-numeric font-medium text-text-primary">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
