import { requireUser } from "@/lib/auth";
import { SupplierForm } from "@/components/suppliers/SupplierForm";

export default async function NovoFornecedorPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Novo fornecedor</h1>
        <p className="text-sm text-text-secondary">Cadastre um novo fornecedor.</p>
      </div>
      <SupplierForm />
    </div>
  );
}
