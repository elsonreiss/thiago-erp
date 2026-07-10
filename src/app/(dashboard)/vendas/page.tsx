import Link from "next/link";
import { DollarSign, Eye, Plus, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { requireUser, currentUserCanViewFinancials } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PaymentMethodBadge } from "@/components/sales/PaymentMethodBadge";
import { canViewFinancials, isAdmin } from "@/domain/entities/User";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Pagination } from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";

interface SearchParams {
  userId?: string;
  from?: string;
  to?: string;
  page?: string;
}

export default async function VendasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const params = await searchParams;
  const canSeeFinancials = await currentUserCanViewFinancials();
  const page = parsePage(params.page);

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const from = params.from || defaultFrom;
  const to = params.to || now.toISOString().slice(0, 10);

  const userIdFilter = canSeeFinancials && params.userId ? Number(params.userId) : undefined;

  const saleFilters = {
    from: `${from} 00:00:00`,
    to: `${to} 23:59:59`,
    userId: canViewFinancials(user.role) ? userIdFilter : user.id,
  };

  const [salePage, sellers, revenueBySeller, totalRevenue] = await Promise.all([
    container.saleRepository.findPage(saleFilters, page, DEFAULT_PAGE_SIZE),
    canSeeFinancials
      ? container.userRepository.findAll().then((users) => users.filter((u) => u.active))
      : Promise.resolve([]),
    canSeeFinancials
      ? container.saleRepository.revenueBySeller(`${from} 00:00:00`, `${to} 23:59:59`)
      : Promise.resolve([]),
    // Faturamento do período inteiro (não só da página atual).
    container.saleRepository.totalRevenue(saleFilters.from, saleFilters.to, saleFilters.userId),
  ]);
  const sales = salePage.items;
  const totalCount = salePage.total;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Vendas</h1>
          <p className="text-sm text-text-secondary">Registro de vendas e controle por vendedor.</p>
        </div>
        <Link
          href="/vendas/nova"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <Plus size={16} /> Nova venda
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard icon={Receipt} label="Vendas no período" value={String(totalCount)} accent="text-text-primary" />
        {canSeeFinancials && (
          <KpiCard icon={DollarSign} label="Faturamento no período" value={formatCurrency(totalRevenue)} accent="text-accent" />
        )}
      </div>

      <form className="price-tag-card flex flex-wrap items-end gap-3 rounded-xl p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">De</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Até</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        {canSeeFinancials && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Vendedor</label>
            <select
              name="userId"
              defaultValue={params.userId ?? ""}
              className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Todos</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
        >
          Filtrar
        </button>
      </form>

      {canSeeFinancials && revenueBySeller.length > 0 && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <TrendingUp size={18} className="text-accent" /> Desempenho por vendedor
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted">
                  <th className="px-2 py-2 font-medium">Vendedor</th>
                  <th className="px-2 py-2 font-medium text-right">Vendas</th>
                  <th className="px-2 py-2 font-medium text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {revenueBySeller.map((row) => (
                  <tr key={row.user_id} className="border-b border-border last:border-0">
                    <td className="px-2 py-2.5 text-text-primary">{row.seller_name}</td>
                    <td className="px-2 py-2.5 text-right font-numeric">{row.count}</td>
                    <td className="px-2 py-2.5 text-right font-numeric font-medium text-text-primary">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  Nenhuma venda encontrada no período.
                </td>
              </tr>
            )}
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(sale.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={14} className="text-text-muted" />
                    <span className="text-text-primary">{sale.customer_name ?? "Consumidor final"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{sale.seller_name}</td>
                <td className="px-4 py-3">
                  <PaymentMethodBadge method={sale.payment_method} />
                </td>
                <td className="px-4 py-3 text-right font-numeric font-medium text-text-primary">
                  {formatCurrency(sale.total)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/vendas/${sale.id}`}
                      className="rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                      title="Ver detalhes"
                    >
                      <Eye size={16} />
                    </Link>
                    {isAdmin(user.role) && (
                      <DeleteButton
                        endpoint={`/api/sales/${sale.id}`}
                        confirmMessage={`Excluir a venda #${sale.id}? O estoque dos itens será devolvido automaticamente.`}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={salePage.page}
          totalPages={salePage.totalPages}
          total={salePage.total}
          basePath="/vendas"
          searchParams={{ from: params.from, to: params.to, userId: params.userId }}
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="price-tag-card flex items-center gap-4 rounded-xl p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-secondary">
        <Icon size={20} className={accent} />
      </div>
      <div>
        <p className="font-numeric text-2xl font-semibold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}
