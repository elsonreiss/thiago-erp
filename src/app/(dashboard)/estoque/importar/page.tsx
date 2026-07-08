import { requireUser } from "@/lib/auth";
import { ImportProductsWizard } from "@/components/products/ImportProductsWizard";

export default async function ImportarProdutosPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Importar produtos</h1>
        <p className="text-sm text-text-secondary">
          Suba uma planilha (Excel ou CSV) ou o PDF de uma nota fiscal pra cadastrar vários produtos de uma vez, sem digitar um por um.
        </p>
      </div>
      <ImportProductsWizard />
    </div>
  );
}
