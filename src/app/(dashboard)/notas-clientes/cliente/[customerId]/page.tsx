import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CustomerNoteStatusBadge } from "@/components/customerNotes/CustomerNoteStatusBadge";
import { OverdueBadge } from "@/components/customerNotes/OverdueBadge";
import { isNoteOverdue } from "@/lib/customerNoteOverdue";
import { CustomerStatementPrintContent } from "@/components/customerNotes/CustomerStatementPrintContent";
import { toCompanyPrintInfo } from "@/lib/companyInfo";
import { DownloadPdfButton } from "@/components/ui/DownloadPdfButton";
import { buildCustomerNotesWhatsAppMessage } from "@/lib/customerNoteMessage";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Params = { params: Promise<{ customerId: string }> };

export default async function ExtratoClientePage({ params }: Params) {
  await requireUser();
  const { customerId } = await params;

  const customer = await container.customerRepository.findById(Number(customerId));
  if (!customer) notFound();

  const notes = await container.customerNoteRepository.findAll({ customerId: customer.id });
  const openNotes = notes.filter((n) => n.status !== "pago");
  const totalDevido = openNotes.reduce(
    (sum, n) => sum + Math.max(0, parseFloat(n.total) - parseFloat(n.paid_amount)),
    0
  );

  const whatsappNumber = customer.whatsapp || customer.phone || null;
  const whatsappLink = buildWhatsAppLink(whatsappNumber, buildCustomerNotesWhatsAppMessage(customer.name, notes));
  const companyInfo = toCompanyPrintInfo(await container.companySettingsRepository.get());

  return (
    <>
    <div className="flex flex-col gap-6 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/notas-clientes"
            className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Extrato de fiado</h1>
            <p className="text-sm text-text-secondary">{customer.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DownloadPdfButton />
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <MessageCircle size={16} /> Enviar por WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Notas em aberto</p>
          <p className="mt-1 font-medium text-text-primary">{openNotes.length}</p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Total de notas</p>
          <p className="mt-1 font-medium text-text-primary">{notes.length}</p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Total devido</p>
          <p className="mt-1 font-numeric font-semibold text-danger">{formatCurrency(totalDevido)}</p>
        </div>
      </div>

      {!whatsappNumber && (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-text-muted">
          Esse cliente não tem WhatsApp/telefone cadastrado — ao clicar em &ldquo;Enviar por WhatsApp&rdquo;, você vai
          precisar escolher o contato manualmente.
        </p>
      )}

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Pago</th>
              <th className="px-4 py-3 font-medium text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {notes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  Nenhuma nota registrada para este cliente.
                </td>
              </tr>
            )}
            {notes.map((note) => {
              const saldo = Math.max(0, parseFloat(note.total) - parseFloat(note.paid_amount));
              return (
                <tr key={note.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                  <td className="px-4 py-3">
                    <Link href={`/notas-clientes/${note.id}`} className="text-text-secondary hover:text-accent">
                      {formatDateTime(note.created_at)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <CustomerNoteStatusBadge status={note.status} />
                      {isNoteOverdue(note) && <OverdueBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-numeric font-medium text-text-primary">
                    {formatCurrency(note.total)}
                  </td>
                  <td className="px-4 py-3 text-right font-numeric text-text-secondary">
                    {formatCurrency(note.paid_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-numeric font-semibold text-danger">
                    {formatCurrency(saldo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    <CustomerStatementPrintContent
      customer={customer}
      notes={notes}
      storeName={companyInfo.name}
      companyDetail={companyInfo.detailLine}
    />
    </>
  );
}
