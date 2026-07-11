import Image from "next/image";
import { Customer } from "@/domain/entities/Customer";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

/**
 * Versão limpa do extrato de fiado em A4, escondida na tela ("hidden
 * print:block") e só exibida na hora de imprimir — permite "Baixar PDF"
 * sem navegar pra outra página.
 */
export function CustomerStatementPrintContent({
  customer,
  notes,
  storeName = "Thiago Casa & Construção",
  companyDetail = null,
}: {
  customer: Customer;
  notes: CustomerNoteWithItems[];
  storeName?: string;
  companyDetail?: string | null;
}) {
  const openNotes = notes.filter((n) => n.status !== "pago");
  const totalDevido = openNotes.reduce(
    (sum, n) => sum + Math.max(0, parseFloat(n.total) - parseFloat(n.paid_amount)),
    0
  );

  return (
    <div className="hidden print:block">
      <style>{`@page { size: A4; margin: 15mm; }`}</style>
      <div className="mx-auto w-full max-w-2xl bg-white p-0 text-black">
        <div className="mb-6 flex items-start justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={56} height={56} className="h-14 w-14 object-contain" />
            <div>
              <p className="font-display text-lg font-bold">{storeName}</p>
              {companyDetail && <p className="text-xs text-gray-500">{companyDetail}</p>}
              <p className="text-sm text-gray-600">Extrato de fiado</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Emitido em</p>
            <p className="text-sm">{formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="mb-6 text-sm">
          <p className="text-xs text-gray-500">Cliente</p>
          <p className="font-medium">{customer.name}</p>
        </div>

        {openNotes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-gray-500">
            Nenhuma nota em aberto. Tudo quitado!
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {openNotes.map((note) => {
              const saldo = Math.max(0, parseFloat(note.total) - parseFloat(note.paid_amount));
              return (
                <div key={note.id} className="border-b border-border pb-4 last:border-0">
                  <p className="mb-2 text-xs text-gray-500">{formatDate(note.created_at)}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-gray-500">
                        <th className="py-2 pr-2 font-medium">Produto</th>
                        <th className="py-2 pr-2 font-medium text-right">Qtd.</th>
                        <th className="py-2 pr-2 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {note.items.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-2">{item.product_name}</td>
                          <td className="py-2 pr-2 text-right">{item.quantity}</td>
                          <td className="py-2 pr-2 text-right">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {note.description && <p className="mt-2 text-xs text-gray-600">Obs: {note.description}</p>}
                  <div className="mt-2 flex justify-end gap-4 text-sm">
                    <span className="text-gray-600">Total: {formatCurrency(note.total)}</span>
                    <span className="text-gray-600">Pago: {formatCurrency(note.paid_amount)}</span>
                    <span className="font-semibold">Saldo: {formatCurrency(saldo)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <div className="flex w-full max-w-xs justify-between text-base font-semibold">
            <span>Total devido</span>
            <span>{formatCurrency(totalDevido)}</span>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-400">Documento sem valor fiscal — não substitui a nota fiscal.</p>
      </div>
    </div>
  );
}
