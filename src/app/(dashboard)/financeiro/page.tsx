import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, ClipboardCheck, TrendingUp, Wallet } from "lucide-react";
import { requireFinancialAccess } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDate } from "@/lib/format";
import { CashFlowChart } from "@/components/financeiro/CashFlowChart";
import { ExpensesByCategoryChart } from "@/components/financeiro/ExpensesByCategoryChart";
import { ExpenseForm } from "@/components/financeiro/ExpenseForm";
import { DeleteButton } from "@/components/ui/DeleteButton";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function FinanceiroPage() {
  await requireFinancialAccess();

  const now = new Date();
  const monthStart = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = toDateOnly(now);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const rangeStart = toDateOnly(fourteenDaysAgo);
  const rangeEnd = toDateOnly(now);

  const [monthRevenue, monthExpenses, revenueByDay, expensesInRange, expensesByCategory, recentExpenses] =
    await Promise.all([
      container.saleRepository.totalRevenue(`${monthStart} 00:00:00`, `${monthEnd} 23:59:59`),
      container.expenseRepository.totalInRange(monthStart, monthEnd),
      container.saleRepository.revenueByDay(`${rangeStart} 00:00:00`, `${rangeEnd} 23:59:59`),
      container.expenseRepository.findAll(rangeStart, rangeEnd),
      container.expenseRepository.totalByCategory(monthStart, monthEnd),
      container.expenseRepository.findAll(),
    ]);

  const revenueByDayMap = new Map(revenueByDay.map((r) => [r.day, r.total]));
  const expensesByDayMap = new Map<string, number>();
  for (const expense of expensesInRange) {
    const day = expense.expense_date.slice(0, 10);
    expensesByDayMap.set(day, (expensesByDayMap.get(day) ?? 0) + parseFloat(expense.amount));
  }

  const cashFlowData = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    const day = toDateOnly(d);
    return {
      day,
      revenue: revenueByDayMap.get(day) ?? 0,
      expenses: expensesByDayMap.get(day) ?? 0,
    };
  });

  const netMonth = monthRevenue - monthExpenses;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Financeiro</h1>
          <p className="text-sm text-text-secondary">Receitas, despesas e fluxo de caixa do mês.</p>
        </div>
        <Link
          href="/caixa"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
        >
          <ClipboardCheck size={16} /> Fechamento de caixa
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={ArrowUpCircle}
          label="Receita do mês"
          value={formatCurrency(monthRevenue)}
          accent="text-success"
        />
        <KpiCard
          icon={ArrowDownCircle}
          label="Despesas do mês"
          value={formatCurrency(monthExpenses)}
          accent="text-danger"
        />
        <KpiCard
          icon={netMonth >= 0 ? TrendingUp : ArrowDownCircle}
          label="Resultado do mês"
          value={formatCurrency(netMonth)}
          accent={netMonth >= 0 ? "text-success" : "text-danger"}
        />
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
          Fluxo de caixa (últimos 14 dias)
        </h2>
        <CashFlowChart data={cashFlowData} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
            Despesas por categoria (mês atual)
          </h2>
          <ExpensesByCategoryChart data={expensesByCategory} />
        </div>

        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text-primary">
            <Wallet size={18} className="text-accent" /> Lançar despesa
          </h2>
          <ExpenseForm />
        </div>
      </div>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {recentExpenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  Nenhuma despesa registrada ainda.
                </td>
              </tr>
            )}
            {recentExpenses.map((expense) => (
              <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3 text-text-secondary">{formatDate(expense.expense_date)}</td>
                <td className="px-4 py-3 text-text-primary">{expense.description}</td>
                <td className="px-4 py-3 text-text-secondary">{expense.category}</td>
                <td className="px-4 py-3 text-right font-numeric font-medium text-danger">
                  -{formatCurrency(expense.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <DeleteButton
                      endpoint={`/api/expenses/${expense.id}`}
                      confirmMessage={`Excluir a despesa "${expense.description}"?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
