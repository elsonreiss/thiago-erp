import Link from "next/link";
import { Eye, NotebookText, Plus, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CustomerNoteStatusBadge } from "@/components/customerNotes/CustomerNoteStatusBadge";
import { CustomerNoteStatus } from "@/domain/entities/CustomerNote";
import { Pagination } from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";

interface SearchParams {
  status?: string;
  page?: string;
}

export default async function NotasClientesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireUser();
  const params = await searchParams;
  const status = (params.status as CustomerNoteStatus) || undefined;
  const page = parsePage(params.page);

  const [notePage, openBalances] = await Promise.all([
    container.customerNoteRepository.findPage({ status }, page, DEFAULT_PAGE_SIZE),
    container.customerNoteRepository.openBalanceByCustomer(),
  ]);
  const notes = notePage.items;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Notas de clientes</h1>
          <p className="text-sm text-text-secondary">Fiado: itens levados por clientes que ainda não pagaram.</p>
        </div>
        <Link
          href="/notas-clientes/nova"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <Plus size={16} /> Nova nota
        </Link>
      </div>

      {openBalances.length > 0 && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
            Clientes com saldo em aberto
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openBalances.map((row) => (
              <Link
                key={row.customer_id}
                href={`/notas-clientes/cliente/${row.customer_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-bg-secondary"
              >
                <div>
                  <p className="font-medium text-text-primary">{row.customer_name}</p>
                  <p className="text-xs text-text-muted">
                    {row.notes_count} nota{row.notes_count > 1 ? "s" : ""} em aberto
                  </p>
                </div>
                <span className="font-numeric font-semibold text-danger">{formatCurrency(row.balance)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <form className="price-tag-card flex flex-wrap items-end gap-3 rounded-xl p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Status</label>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Todos</option>
            <option value="aberto">Em aberto</option>
            <option value="parcial">Pago parcialmente</option>
            <option value="pago">Quitada</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
        >
          Filtrar
        </button>
      </form>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Pago</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {notes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  Nenhuma nota encontrada.
                </td>
              </tr>
            )}
            {notes.map((note) => (
              <tr key={note.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(note.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <NotebookText size={14} className="text-text-muted" />
                    <span className="text-text-primary">{note.customer_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{note.seller_name}</td>
                <td className="px-4 py-3">
                  <CustomerNoteStatusBadge status={note.status} />
                </td>
                <td className="px-4 py-3 text-right font-numeric font-medium text-text-primary">
                  {formatCurrency(note.total)}
                </td>
                <td className="px-4 py-3 text-right font-numeric text-text-secondary">
                  {formatCurrency(note.paid_amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/notas-clientes/cliente/${note.customer_id}`}
                      className="rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                      title="Extrato do cliente"
                    >
                      <Receipt size={16} />
                    </Link>
                    <Link
                      href={`/notas-clientes/${note.id}`}
                      className="rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                      title="Ver detalhes"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={notePage.page}
          totalPages={notePage.totalPages}
          total={notePage.total}
          basePath="/notas-clientes"
          searchParams={{ status: params.status }}
        />
      </div>
    </div>
  );
}
