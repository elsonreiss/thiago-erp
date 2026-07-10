import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireFinancialAccess } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";
import { CashClosingForm } from "@/components/cashClosings/CashClosingForm";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CaixaDatePage({ params }: { params: Promise<{ date: string }> }) {
  await requireFinancialAccess();
  const { date } = await params;

  if (!DATE_RE.test(date)) notFound();

  const [existing, breakdown] = await Promise.all([
    container.cashClosingRepository.findByDate(date),
    container.saleRepository.revenueByPaymentMethodForDay(date),
  ]);

  const salesCashRow = breakdown.find((row) => row.payment_method === "dinheiro");
  const salesCash = salesCashRow?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/caixa"
          className="flex items-center gap-1.5 rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            Fechamento de {formatDate(date)}
          </h1>
          <p className="text-sm text-text-secondary">
            {existing ? `Já fechado por ${existing.user_name}` : "Ainda não fechado"}
          </p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-text-primary">
            Vendas do dia por forma de pagamento
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {breakdown.map((row) => (
              <div key={row.payment_method} className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-text-muted">{PAYMENT_METHOD_LABELS[row.payment_method]}</p>
                <p className="font-numeric text-sm font-semibold text-text-primary">{formatCurrency(row.total)}</p>
                <p className="text-xs text-text-muted">
                  {row.count} venda{row.count === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <CashClosingForm
        closingDate={date}
        salesCash={salesCash}
        initialOpeningAmount={existing?.opening_amount}
        initialCountedCash={existing?.counted_cash}
        initialNotes={existing?.notes}
        alreadyClosed={!!existing}
      />
    </div>
  );
}
