import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { ProductForm } from "@/components/products/ProductForm";
import { RecentPurchasesPanel } from "@/components/products/RecentPurchasesPanel";

export default async function NovoProdutoPage() {
  await requireUser();

  const purchases = (await container.purchaseRepository.findAll()).slice(0, 20);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Novo produto</h1>
        <p className="text-sm text-text-secondary">Cadastre um novo item no estoque.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductForm />
        </div>
        <div className="lg:col-span-1">
          <RecentPurchasesPanel purchases={purchases} />
        </div>
      </div>
    </div>
  );
}
