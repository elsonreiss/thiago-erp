import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { toCompanyPrintInfo } from "@/lib/companyInfo";
import { QuickSaleForm } from "@/components/sales/QuickSaleForm";

export default async function CaixaRapidoPage() {
  const user = await requireUser();
  const companyInfo = toCompanyPrintInfo(await container.companySettingsRepository.get());

  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Caixa rápido</h1>
        <p className="text-sm text-text-secondary">
          Venda direto com o leitor de código de barras — escaneia, confere o total e finaliza.
        </p>
      </div>
      <QuickSaleForm sellerName={user.name} storeName={companyInfo.name} companyDetail={companyInfo.detailLine} />
    </div>
  );
}
