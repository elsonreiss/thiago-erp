import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { SupplierForm } from "@/components/suppliers/SupplierForm";

export default async function EditarFornecedorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const supplier = await container.supplierRepository.findById(Number(id));
  if (!supplier) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Editar fornecedor</h1>
        <p className="text-sm text-text-secondary">{supplier.name}</p>
      </div>
      <SupplierForm supplier={supplier} />
    </div>
  );
}
