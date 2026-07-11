import Image from "next/image";
import { BudgetWithItems } from "@/domain/entities/Budget";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

/**
 * Versão limpa do orçamento em A4, escondida na tela ("hidden print:block")
 * e só exibida na hora de imprimir — permite "Baixar PDF" sem navegar pra
 * outra página.
 */
export function BudgetPrintContent({
  budget,
  storeName = "Thiago Casa & Construção",
  companyDetail = null,
}: {
  budget: BudgetWithItems;
  storeName?: string;
  companyDetail?: string | null;
}) {
  const subtotal = budget.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

  return (
    <div className="hidden print:block">
      <style>{`@page { size: A4; margin: 15mm; }`}</style>
      <div className="mx-auto w-full max-w-2xl bg-white p-0 text-black">
        <div className="mb-6 flex items-start justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={56} height={56} className="h-14 w-14 object-contain" />
            <div>
              <p className="font-display text-lg font-bold">{storeName}</p>
              {companyDetail && <p className="text-xs text-gray-500">{companyDetail}</p>}
              <p className="text-sm text-gray-600">Orçamento</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Emitido em</p>
            <p className="text-sm">{formatDateTime(budget.created_at)}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Cliente</p>
            <p className="font-medium">{budget.customer_name ?? "Consumidor final"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Vendedor</p>
            <p className="font-medium">{budget.seller_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Válido até</p>
            <p className="font-medium">
              {budget.validity_date ? formatDate(budget.validity_date) : "Sem validade definida"}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="py-2 pr-2 font-medium">Produto</th>
              <th className="py-2 pr-2 font-medium text-right">Qtd.</th>
              <th className="py-2 pr-2 font-medium text-right">Preço unit.</th>
              <th className="py-2 pr-2 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-2">{item.product_name}</td>
                <td className="py-2 pr-2 text-right">{item.quantity}</td>
                <td className="py-2 pr-2 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="py-2 pr-2 text-right">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4">
          <div className="flex w-full max-w-xs justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-sm text-gray-600">
            <span>Desconto</span>
            <span>-{formatCurrency(budget.discount)}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(budget.total)}</span>
          </div>
        </div>

        {budget.notes && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-1 text-xs font-medium text-gray-500">Observações</p>
            <p className="text-sm text-gray-600">{budget.notes}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-500">
          Orçamento sujeito a alteração sem aviso prévio após o prazo de validade.
        </p>
        <p className="mt-2 text-center text-[10px] text-gray-400">Documento sem valor fiscal — não substitui a nota fiscal.</p>
      </div>
    </div>
  );
}
