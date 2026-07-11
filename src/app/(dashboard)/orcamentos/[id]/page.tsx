import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, ShoppingCart, User } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { BudgetStatusBadge } from "@/components/budgets/BudgetStatusBadge";
import { BudgetActions } from "@/components/budgets/BudgetActions";
import { BudgetPrintContent } from "@/components/budgets/BudgetPrintContent";
import { toCompanyPrintInfo } from "@/lib/companyInfo";
import { DownloadPdfButton } from "@/components/ui/DownloadPdfButton";
import { buildBudgetWhatsAppMessage } from "@/lib/budgetMessage";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Params = { params: Promise<{ id: string }> };

export default async function OrcamentoDetalhePage({ params }: Params) {
  await requireUser();
  const { id } = await params;

  const budget = await container.budgetRepository.findById(Number(id));
  if (!budget) notFound();

  const customer = budget.customer_id ? await container.customerRepository.findById(budget.customer_id) : null;
  const whatsappNumber = customer?.whatsapp || customer?.phone || null;
  const whatsappLink = buildWhatsAppLink(whatsappNumber, buildBudgetWhatsAppMessage(budget));

  const subtotal = budget.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const companyInfo = toCompanyPrintInfo(await container.companySettingsRepository.get());

  return (
    <>
    <div className="flex flex-col gap-6 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/orcamentos"
            className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Orçamento</h1>
            <p className="text-sm text-text-secondary">{formatDateTime(budget.created_at)}</p>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Cliente</p>
          <p className="mt-1 font-medium text-text-primary">{budget.customer_name ?? "Consumidor final"}</p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Vendedor</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium text-text-primary">
            <User size={14} className="text-text-muted" /> {budget.seller_name}
          </p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Válido até</p>
          <p className="mt-1 font-medium text-text-primary">
            {budget.validity_date ? formatDate(budget.validity_date) : "Sem validade definida"}
          </p>
        </div>
        <div className="price-tag-card rounded-xl p-5">
          <p className="text-xs text-text-muted">Status</p>
          <div className="mt-1.5">
            <BudgetStatusBadge status={budget.status} />
          </div>
        </div>
      </div>

      {!whatsappNumber && (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-text-muted">
          Esse cliente não tem WhatsApp/telefone cadastrado — ao clicar em &ldquo;Enviar por WhatsApp&rdquo;, você vai
          precisar escolher o contato manualmente.
        </p>
      )}

      {budget.status === "convertido" && budget.converted_sale_id && (
        <Link
          href={`/vendas/${budget.converted_sale_id}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-accent-soft px-4 py-3 text-sm font-medium text-accent hover:opacity-80"
        >
          <ShoppingCart size={16} /> Ver venda gerada a partir deste orçamento
        </Link>
      )}

      <div className="price-tag-card rounded-xl p-6">
        <BudgetActions id={budget.id} status={budget.status} />
      </div>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium text-right">Qtd.</th>
              <th className="px-4 py-3 font-medium text-right">Preço unit.</th>
              <th className="px-4 py-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-primary">{item.product_name}</td>
                <td className="px-4 py-3 text-right font-numeric">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col items-end gap-1 border-t border-border p-4">
          <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
            <span>Subtotal</span>
            <span className="font-numeric">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-sm text-text-secondary">
            <span>Desconto</span>
            <span className="font-numeric">-{formatCurrency(budget.discount)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-base font-semibold text-text-primary">
            <span>Total</span>
            <span className="font-numeric">{formatCurrency(budget.total)}</span>
          </div>
        </div>
      </div>

      {budget.notes && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-2 font-display text-base font-semibold text-text-primary">Observações</h2>
          <p className="text-sm text-text-secondary">{budget.notes}</p>
        </div>
      )}
    </div>
    <BudgetPrintContent budget={budget} storeName={companyInfo.name} companyDetail={companyInfo.detailLine} />
    </>
  );
}
