import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { container } from "@/container";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PrintButton } from "@/components/budgets/PrintButton";

type Params = { params: Promise<{ customerId: string }> };

export default async function ImprimirExtratoClientePage({ params }: Params) {
  const { customerId } = await params;

  const customer = await container.customerRepository.findById(Number(customerId));
  if (!customer) notFound();

  const notes = await container.customerNoteRepository.findAll({ customerId: customer.id });
  const openNotes = notes.filter((n) => n.status !== "pago");
  const totalDevido = openNotes.reduce(
    (sum, n) => sum + Math.max(0, parseFloat(n.total) - parseFloat(n.paid_amount)),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/notas-clientes/cliente/${customer.id}`}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-border bg-surface p-8 print:border-none print:p-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between border-b border-border pb-6">
          <div>
            <p className="font-display text-lg font-bold text-text-primary">Thiago Casa &amp; Construção</p>
            <p className="text-sm text-text-secondary">Extrato de fiado</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Emitido em</p>
            <p className="text-sm text-text-primary">{formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="mb-6 text-sm">
          <p className="text-xs text-text-muted">Cliente</p>
          <p className="font-medium text-text-primary">{customer.name}</p>
        </div>

        {openNotes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
            Nenhuma nota em aberto. Tudo quitado!
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {openNotes.map((note) => {
              const saldo = Math.max(0, parseFloat(note.total) - parseFloat(note.paid_amount));
              return (
                <div key={note.id} className="border-b border-border pb-4 last:border-0">
                  <p className="mb-2 text-xs text-text-muted">{formatDate(note.created_at)}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-text-muted">
                        <th className="py-2 pr-2 font-medium">Produto</th>
                        <th className="py-2 pr-2 font-medium text-right">Qtd.</th>
                        <th className="py-2 pr-2 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {note.items.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-2 text-text-primary">{item.product_name}</td>
                          <td className="py-2 pr-2 text-right font-numeric">{item.quantity}</td>
                          <td className="py-2 pr-2 text-right font-numeric">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {note.description && (
                    <p className="mt-2 text-xs text-text-secondary">Obs: {note.description}</p>
                  )}
                  <div className="mt-2 flex justify-end gap-4 text-sm">
                    <span className="text-text-secondary">Total: {formatCurrency(note.total)}</span>
                    <span className="text-text-secondary">Pago: {formatCurrency(note.paid_amount)}</span>
                    <span className="font-semibold text-text-primary">Saldo: {formatCurrency(saldo)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
            <span>Total devido</span>
            <span className="font-numeric">{formatCurrency(totalDevido)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
