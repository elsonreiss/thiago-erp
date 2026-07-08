import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { ProductForm } from "@/components/products/ProductForm";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const product = await container.productRepository.findById(Number(id));
  if (!product) notFound();

  const supplier = product.supplier_id
    ? await container.supplierRepository.findById(product.supplier_id)
    : null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Editar produto</h1>
        <p className="text-sm text-text-secondary">{product.name}</p>
      </div>
      <ProductForm product={product} initialSupplier={supplier} />
    </div>
  );
}
