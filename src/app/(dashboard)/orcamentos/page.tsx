import Link from "next/link";
import { Eye, FileText, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { BudgetStatusBadge } from "@/components/budgets/BudgetStatusBadge";
import { BudgetStatus } from "@/domain/entities/Budget";
import { Pagination } from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";

interface SearchParams {
  status?: string;
  page?: string;
}

export default async function OrcamentosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireUser();
  const params = await searchParams;
  const status = (params.status as BudgetStatus) || undefined;
  const page = parsePage(params.page);

  const budgetPage = await container.budgetRepository.findPage(status, page, DEFAULT_PAGE_SIZE);
  const budgets = budgetPage.items;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Orçamentos</h1>
          <p className="text-sm text-text-secondary">Propostas de venda sem baixa de estoque.</p>
        </div>
        <Link
          href="/orcamentos/novo"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <Plus size={16} /> Novo orçamento
        </Link>
      </div>

      <form className="price-tag-card flex flex-wrap items-end gap-3 rounded-xl p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Status</label>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
            <option value="convertido">Convertido</option>
            <option value="expirado">Expirado</option>
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
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            )}
            {budgets.map((budget) => (
              <tr key={budget.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(budget.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-text-muted" />
                    <span className="text-text-primary">{budget.customer_name ?? "Consumidor final"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{budget.seller_name}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {budget.validity_date ? formatDate(budget.validity_date) : "-"}
                </td>
                <td className="px-4 py-3">
                  <BudgetStatusBadge status={budget.status} />
                </td>
                <td className="px-4 py-3 text-right font-numeric font-medium text-text-primary">
                  {formatCurrency(budget.total)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Link
                      href={`/orcamentos/${budget.id}`}
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
          page={budgetPage.page}
          totalPages={budgetPage.totalPages}
          total={budgetPage.total}
          basePath="/orcamentos"
          searchParams={{ status: params.status }}
        />
      </div>
    </div>
  );
}
