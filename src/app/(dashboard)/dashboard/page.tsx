import Link from "next/link";
import {
  AlertTriangle,
  DollarSign,
  PackageX,
  Receipt,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { canViewFinancials } from "@/domain/entities/User";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getStockStatus } from "@/domain/entities/Product";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { PaymentMethodBadge } from "@/components/sales/PaymentMethodBadge";
import { RevenueChart, type RevenuePoint } from "@/components/dashboard/RevenueChart";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { SaleWithItems } from "@/domain/entities/Sale";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default async function DashboardPage() {
  const user = await requireUser();
  const canSeeFinancials = canViewFinancials(user.role);

  const now = new Date();
  const todayStart = `${toDateOnly(now)} 00:00:00`;
  const todayEnd = `${toDateOnly(now)} 23:59:59`;
  const monthStart = `${toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1))} 00:00:00`;

  const [
    totalProducts,
    outOfStock,
    lowStock,
    problemProducts,
    recentSales,
    topProducts,
    customersCount,
  ] = await Promise.all([
    container.productRepository.countTotal(),
    container.productRepository.countOutOfStock(),
    container.productRepository.countLowStock(),
    container.productRepository.findAll({ stockStatus: "em_falta" }),
    container.saleRepository
      .findAll(canSeeFinancials ? {} : { userId: user.id })
      .then((list) => list.slice(0, 8)),
    container.productRepository.mostSold(5, monthStart),
    container.customerRepository.findAll().then((c) => c.length),
  ]);

  const stockAlertProducts =
    problemProducts.length > 0
      ? problemProducts
      : await container.productRepository.findAll({ stockStatus: "estoque_baixo" });

  let salesToday = 0;
  let revenueToday = 0;
  let revenueMonth = 0;
  let topCustomers: Array<{ customer: { id: number; name: string }; total_spent: number }> = [];
  let sellerPerformance: Array<{
    user_id: number;
    seller_name: string;
    photo: string | null;
    total: number;
    count: number;
    recentSales: SaleWithItems[];
  }> = [];
  let dailyRevenue: RevenuePoint[] = [];
  let weeklyRevenue: RevenuePoint[] = [];
  let monthlyRevenue: RevenuePoint[] = [];

  if (canSeeFinancials) {
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 55);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [salesTodayCount, revToday, revMonth, dailyRows, weeklyRows, monthlyRows, buyers, sellerTotals, monthSales, allUsers] =
      await Promise.all([
        container.saleRepository.countSalesToday(),
        container.saleRepository.totalRevenue(todayStart, todayEnd),
        container.saleRepository.totalRevenue(monthStart, `${toDateOnly(now)} 23:59:59`),
        container.saleRepository.revenueByDay(`${toDateOnly(fourteenDaysAgo)} 00:00:00`, `${toDateOnly(now)} 23:59:59`),
        container.saleRepository.revenueByDay(`${toDateOnly(eightWeeksAgo)} 00:00:00`, `${toDateOnly(now)} 23:59:59`),
        container.saleRepository.revenueByMonth(
          `${toDateOnly(sixMonthsAgo)} 00:00:00`,
          `${toDateOnly(now)} 23:59:59`
        ),
        container.customerRepository.topBuyers(5, monthStart),
        container.saleRepository.revenueBySeller(monthStart, `${toDateOnly(now)} 23:59:59`),
        container.saleRepository.findAll({ from: monthStart, to: `${toDateOnly(now)} 23:59:59` }),
        container.userRepository.findAll(),
      ]);

    salesToday = salesTodayCount;
    revenueToday = revToday;
    revenueMonth = revMonth;
    topCustomers = buyers;

    const salesByUser = new Map<number, SaleWithItems[]>();
    for (const sale of monthSales) {
      const list = salesByUser.get(sale.user_id) ?? [];
      list.push(sale);
      salesByUser.set(sale.user_id, list);
    }
    const photoByUser = new Map(allUsers.map((u) => [u.id, u.photo]));
    sellerPerformance = sellerTotals.map((row) => ({
      user_id: row.user_id,
      seller_name: row.seller_name,
      photo: photoByUser.get(row.user_id) ?? null,
      total: row.total,
      count: row.count,
      recentSales: (salesByUser.get(row.user_id) ?? []).slice(0, 3),
    }));

    const dailyMap = new Map(dailyRows.map((r) => [r.day, r.total]));
    dailyRevenue = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = toDateOnly(d);
      return { label: formatDate(key).slice(0, 5), total: dailyMap.get(key) ?? 0 };
    });

    const weeklyMap = new Map(weeklyRows.map((r) => [r.day, r.total]));
    weeklyRevenue = Array.from({ length: 8 }).map((_, i) => {
      const weekStart = new Date(eightWeeksAgo);
      weekStart.setDate(weekStart.getDate() + i * 7);
      let sum = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + d);
        sum += weeklyMap.get(toDateOnly(day)) ?? 0;
      }
      return { label: `${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`, total: sum };
    });

    const monthlyMap = new Map(monthlyRows.map((r) => [r.month, r.total]));
    monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { label: MONTH_LABELS[d.getMonth()], total: monthlyMap.get(key) ?? 0 };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Olá, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-text-secondary">Visão geral da loja.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canSeeFinancials && (
          <KpiCard icon={DollarSign} label="Receita hoje" value={formatCurrency(revenueToday)} accent="text-success" />
        )}
        {canSeeFinancials && (
          <KpiCard icon={TrendingUp} label="Receita do mês" value={formatCurrency(revenueMonth)} accent="text-accent" />
        )}
        <KpiCard icon={Receipt} label="Vendas hoje" value={String(canSeeFinancials ? salesToday : "—")} accent="text-text-primary" />
        <KpiCard icon={Users} label="Clientes ativos" value={String(customersCount)} accent="text-text-primary" />
        <KpiCard icon={PackageX} label="Produtos em falta" value={String(outOfStock)} accent="text-danger" />
        <KpiCard icon={AlertTriangle} label="Estoque baixo" value={String(lowStock)} accent="text-warning" />
        <KpiCard icon={ShoppingCart} label="Produtos cadastrados" value={String(totalProducts)} accent="text-text-primary" />
      </div>

      {canSeeFinancials && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-1 font-display text-base font-semibold text-text-primary">Receita</h2>
          <p className="mb-4 text-sm text-text-secondary">Alterne entre visão diária, semanal e mensal.</p>
          <RevenueChart daily={dailyRevenue} weekly={weeklyRevenue} monthly={monthlyRevenue} />
        </div>
      )}

      {canSeeFinancials && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-1 font-display text-base font-semibold text-text-primary">Desempenho por vendedor (mês)</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Vendas e faturamento de cada vendedor, com o controle do administrador.
          </p>
          {sellerPerformance.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma venda registrada este mês.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sellerPerformance.map((seller) => (
                <div key={seller.user_id} className="flex flex-col rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center gap-2.5">
                    <UserAvatar user={{ name: seller.seller_name, photo: seller.photo }} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">{seller.seller_name}</p>
                      <p className="text-xs text-text-muted">{seller.count} venda{seller.count === 1 ? "" : "s"} no mês</p>
                    </div>
                  </div>

                  <p className="mb-3 font-numeric text-xl font-semibold text-text-primary">
                    {formatCurrency(seller.total)}
                  </p>

                  {seller.recentSales.length > 0 && (
                    <div className="mb-3 flex flex-col gap-1.5 border-t border-border pt-3">
                      {seller.recentSales.map((sale) => (
                        <Link
                          key={sale.id}
                          href={`/vendas/${sale.id}`}
                          className="flex items-center justify-between gap-2 text-xs hover:opacity-80"
                        >
                          <span className="min-w-0 flex-1 truncate text-text-secondary">
                            {sale.customer_name ?? "Consumidor final"}
                          </span>
                          <span className="shrink-0 font-numeric text-text-primary">{formatCurrency(sale.total)}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/vendas?userId=${seller.user_id}`}
                    className="mt-auto text-xs font-medium text-accent hover:underline"
                  >
                    Ver todas as vendas de {seller.seller_name.split(" ")[0]}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-text-primary">{canSeeFinancials ? "Vendas recentes" : "Minhas vendas recentes"}</h2>
          {recentSales.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/vendas/${sale.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="truncate text-text-primary">{sale.customer_name ?? "Consumidor final"}</p>
                    <p className="text-xs text-text-muted">{formatDateTime(sale.created_at)} · {sale.seller_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentMethodBadge method={sale.payment_method} />
                    <span className="font-numeric font-medium text-text-primary">{formatCurrency(sale.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <AlertTriangle size={18} className="text-warning" /> Alertas de estoque
          </h2>
          {stockAlertProducts.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum alerta de estoque no momento.</p>
          ) : (
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
              {stockAlertProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/estoque/${product.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="truncate text-text-primary">{product.name}</p>
                    <p className="text-xs text-text-muted">
                      {product.quantity} {product.unit} em estoque · mínimo {product.min_stock}
                    </p>
                    <p className="text-xs text-text-muted">
                      Compra: {formatCurrency(product.purchase_price)} · Venda: {formatCurrency(product.sale_price)}
                    </p>
                  </div>
                  <ProductStatusBadge status={getStockStatus(product)} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <Star size={18} className="text-accent" /> Produtos mais vendidos (mês)
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma venda registrada este mês.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topProducts.map(({ product, total_quantity }) => (
                <div key={product.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0">
                  <span className="truncate text-text-primary">{product.name}</span>
                  <span className="font-numeric font-medium text-text-secondary">{total_quantity} {product.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {canSeeFinancials && (
          <div className="price-tag-card rounded-xl p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text-primary">
              <Users size={18} className="text-accent" /> Melhores clientes (mês)
            </h2>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhuma compra registrada este mês.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topCustomers.map(({ customer, total_spent }) => (
                  <Link
                    key={customer.id}
                    href={`/clientes/${customer.id}`}
                    className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0 hover:opacity-80"
                  >
                    <span className="truncate text-text-primary">{customer.name}</span>
                    <span className="font-numeric font-medium text-text-secondary">{formatCurrency(total_spent)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
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
