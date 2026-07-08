import { requireUser } from "@/lib/auth";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";

export default async function NovaCompraPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Nova compra</h1>
        <p className="text-sm text-text-secondary">Registre entrada de estoque vinda de um fornecedor.</p>
      </div>
      <PurchaseForm userName={user.name} />
    </div>
  );
}
