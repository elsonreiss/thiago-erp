import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { container } from "@/container";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";

export default async function DadosEmpresaPage() {
  await requireAdmin();
  const settings = await container.companySettingsRepository.get();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/configuracoes"
          className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Dados da empresa</h1>
          <p className="text-sm text-text-secondary">CNPJ, endereço e regime tributário usados nos comprovantes.</p>
        </div>
      </div>

      <CompanySettingsForm settings={settings} />
    </div>
  );
}
