import { requireUser } from "@/lib/auth";
import { SaleForm } from "@/components/sales/SaleForm";

export default async function NovaVendaPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Nova venda</h1>
        <p className="text-sm text-text-secondary">Registre uma venda com baixa automática de estoque.</p>
      </div>
      <SaleForm sellerName={user.name} />
    </div>
  );
}
