import { Download, PackageX, Receipt, TrendingUp, Warehouse } from "lucide-react";
import { requireFinancialAccess } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

interface SearchParams {
  from?: string;
  to?: string;
  days?: string;
  year?: string;
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default async function RelatoriosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireFinancialAccess();
  const params = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const from = params.from || defaultFrom;
  const to = params.to || now.toISOString().slice(0, 10);
  const days = Number(params.days ?? "60");
  const year = Number(params.year ?? String(now.getFullYear()));

  const [sales, products, stagnantProducts, revenueByMonth] = await Promise.all([
    container.saleRepository.findAll({ from: `${from} 00:00:00`, to: `${to} 23:59:59` }),
    container.productRepository.findAll({ activeOnly: false }),
    container.productRepository.stagnant(days),
    container.saleRepository.revenueByMonth(`${year}-01-01 00:00:00`, `${year}-12-31 23:59:59`),
  ]);

  const salesTotal = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);

  const stockCostTotal = products.reduce((sum, p) => sum + parseFloat(p.purchase_price) * p.quantity, 0);
  const stockSaleTotal = products.reduce((sum, p) => sum + parseFloat(p.sale_price) * p.quantity, 0);

  const revenueByMonthMap = new Map(revenueByMonth.map((r) => [r.month, r.total]));
  const fullYearRevenue = MONTH_LABELS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return { label, total: revenueByMonthMap.get(key) ?? 0 };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Relatórios</h1>
        <p className="text-sm text-text-secondary">Vendas, estoque e receita — tudo exportável em CSV.</p>
      </div>

      {/* Vendas completas */}
      <section className="price-tag-card rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <Receipt size={18} className="text-accent" /> Vendas completas
          </h2>
          <a
            href={`/api/reports/sales/csv?from=${from}&to=${to}`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <Download size={14} /> Exportar CSV
          </a>
        </div>

        <form className="mb-4 flex flex-wrap items-end gap-3">
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
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            Filtrar
          </button>
        </form>

        <p className="mb-3 text-sm text-text-secondary">
          {sales.length} vendas · Total: <span className="font-numeric font-semibold text-text-primary">{formatCurrency(salesTotal)}</span>
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Vendedor</th>
                <th className="px-3 py-2 font-medium">Pagamento</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-text-muted">
                    Nenhuma venda no período.
                  </td>
                </tr>
              )}
              {sales.slice(0, 50).map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-text-secondary">{formatDateTime(s.created_at)}</td>
                  <td className="px-3 py-2 text-text-primary">{s.customer_name ?? "Consumidor final"}</td>
                  <td className="px-3 py-2 text-text-secondary">{s.seller_name}</td>
                  <td className="px-3 py-2 text-text-secondary">{PAYMENT_METHOD_LABELS[s.payment_method]}</td>
                  <td className="px-3 py-2 text-right font-numeric font-medium text-text-primary">
                    {formatCurrency(s.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length > 50 && (
            <p className="mt-2 text-xs text-text-muted">
              Mostrando as primeiras 50 de {sales.length} vendas. Exporte o CSV para ver todas.
            </p>
          )}
        </div>
      </section>

      {/* Valorização de estoque */}
      <section className="price-tag-card rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <Warehouse size={18} className="text-accent" /> Valorização de estoque
          </h2>
          <a
            href="/api/reports/stock-valuation/csv"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <Download size={14} /> Exportar CSV
          </a>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-bg-secondary p-4">
            <p className="text-xs text-text-muted">Valor total em custo</p>
            <p className="font-numeric text-xl font-semibold text-text-primary">{formatCurrency(stockCostTotal)}</p>
          </div>
          <div className="rounded-lg border border-border bg-bg-secondary p-4">
            <p className="text-xs text-text-muted">Valor total em venda</p>
            <p className="font-numeric text-xl font-semibold text-text-primary">{formatCurrency(stockSaleTotal)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 font-medium text-right">Qtd.</th>
                <th className="px-3 py-2 font-medium text-right">Custo unit.</th>
                <th className="px-3 py-2 font-medium text-right">Valor em custo</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 50).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-text-primary">
                    {p.name} <span className="text-xs text-text-muted">({p.code})</span>
                  </td>
                  <td className="px-3 py-2 text-right font-numeric">{p.quantity}</td>
                  <td className="px-3 py-2 text-right font-numeric">{formatCurrency(p.purchase_price)}</td>
                  <td className="px-3 py-2 text-right font-numeric font-medium text-text-primary">
                    {formatCurrency(parseFloat(p.purchase_price) * p.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length > 50 && (
            <p className="mt-2 text-xs text-text-muted">
              Mostrando os primeiros 50 de {products.length} produtos. Exporte o CSV para ver todos.
            </p>
          )}
        </div>
      </section>

      {/* Produtos parados */}
      <section className="price-tag-card rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <PackageX size={18} className="text-accent" /> Produtos parados
          </h2>
          <a
            href={`/api/reports/stagnant-products/csv?days=${days}`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <Download size={14} /> Exportar CSV
          </a>
        </div>

        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Sem movimento há (dias)</label>
            <input
              type="number"
              name="days"
              min={1}
              defaultValue={days}
              className="w-32 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            Filtrar
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 font-medium text-right">Qtd. em estoque</th>
                <th className="px-3 py-2 font-medium text-right">Preço venda</th>
                <th className="px-3 py-2 font-medium">Última atualização</th>
              </tr>
            </thead>
            <tbody>
              {stagnantProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                    Nenhum produto parado nesse período.
                  </td>
                </tr>
              )}
              {stagnantProducts.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-text-primary">
                    {p.name} <span className="text-xs text-text-muted">({p.code})</span>
                  </td>
                  <td className="px-3 py-2 text-right font-numeric">{p.quantity}</td>
                  <td className="px-3 py-2 text-right font-numeric">{formatCurrency(p.sale_price)}</td>
                  <td className="px-3 py-2 text-text-secondary">{formatDate(p.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Receita mensal */}
      <section className="price-tag-card rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <TrendingUp size={18} className="text-accent" /> Receita mensal ({year})
          </h2>
          <a
            href={`/api/reports/monthly-revenue/csv?year=${year}`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <Download size={14} /> Exportar CSV
          </a>
        </div>

        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Ano</label>
            <input
              type="number"
              name="year"
              defaultValue={year}
              className="w-28 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            Filtrar
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-3 py-2 font-medium">Mês</th>
                <th className="px-3 py-2 font-medium text-right">Receita</th>
              </tr>
            </thead>
            <tbody>
              {fullYearRevenue.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-text-primary">{row.label}</td>
                  <td className="px-3 py-2 text-right font-numeric font-medium text-text-primary">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
