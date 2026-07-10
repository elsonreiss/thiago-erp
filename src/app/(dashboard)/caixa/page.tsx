import Link from "next/link";
import { CheckCircle2, ClipboardList, Plus } from "lucide-react";
import { requireFinancialAccess } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDate } from "@/lib/format";
import { Pagination } from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";

interface SearchParams {
  page?: string;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function CaixaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireFinancialAccess();
  const params = await searchParams;
  const page = parsePage(params.page);

  const closingPage = await container.cashClosingRepository.findPage(page, DEFAULT_PAGE_SIZE);
  const closings = closingPage.items;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Fechamento de caixa</h1>
          <p className="text-sm text-text-secondary">Confira o dinheiro do caixa ao final do dia.</p>
        </div>
        <Link
          href={`/caixa/${todayDate()}`}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <Plus size={16} /> Fechar caixa de hoje
        </Link>
      </div>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium text-right">Esperado</th>
              <th className="px-4 py-3 font-medium text-right">Contado</th>
              <th className="px-4 py-3 font-medium text-right">Diferença</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {closings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  Nenhum fechamento registrado ainda.
                </td>
              </tr>
            )}
            {closings.map((closing) => {
              const diff = parseFloat(closing.difference);
              const diffClass =
                Math.abs(diff) < 0.005 ? "text-text-secondary" : diff > 0 ? "text-success" : "text-danger";
              return (
                <tr key={closing.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={14} className="text-text-muted" />
                      <span className="text-text-primary">{formatDate(closing.closing_date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{closing.user_name}</td>
                  <td className="px-4 py-3 text-right font-numeric text-text-secondary">
                    {formatCurrency(closing.expected_total)}
                  </td>
                  <td className="px-4 py-3 text-right font-numeric text-text-primary">
                    {formatCurrency(closing.counted_cash)}
                  </td>
                  <td className={`px-4 py-3 text-right font-numeric font-medium ${diffClass}`}>
                    {diff > 0 ? "+" : ""}
                    {formatCurrency(closing.difference)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/caixa/${closing.closing_date.slice(0, 10)}`}
                        className="flex items-center gap-1.5 rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                        title="Ver / editar"
                      >
                        <CheckCircle2 size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          page={closingPage.page}
          totalPages={closingPage.totalPages}
          total={closingPage.total}
          basePath="/caixa"
          searchParams={{}}
        />
      </div>
    </div>
  );
}
