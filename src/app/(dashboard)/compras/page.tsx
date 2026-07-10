import Link from "next/link";
import { Eye, Plus, Truck } from "lucide-react";
import { requireUser, currentUserCanViewFinancials } from "@/lib/auth";
import { container } from "@/container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";

interface SearchParams {
  page?: string;
}

export default async function ComprasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireUser();
  const canSeeFinancials = await currentUserCanViewFinancials();
  const params = await searchParams;
  const page = parsePage(params.page);

  const [purchasePage, totalSpent] = await Promise.all([
    container.purchaseRepository.findPage(page, DEFAULT_PAGE_SIZE),
    container.purchaseRepository.totalSpent("1970-01-01", "2999-12-31"),
  ]);
  const purchases = purchasePage.items;
  const totalCount = purchasePage.total;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Compras</h1>
          <p className="text-sm text-text-secondary">Entradas de estoque vindas de fornecedores.</p>
        </div>
        <Link
          href="/compras/nova"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <Plus size={16} /> Nova compra
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="price-tag-card flex items-center gap-4 rounded-xl p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-secondary">
            <Truck size={20} className="text-text-primary" />
          </div>
          <div>
            <p className="font-numeric text-2xl font-semibold text-text-primary">{totalCount}</p>
            <p className="text-xs text-text-muted">Compras registradas</p>
          </div>
        </div>
        {canSeeFinancials && (
          <div className="price-tag-card flex items-center gap-4 rounded-xl p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-secondary">
              <Truck size={20} className="text-accent" />
            </div>
            <div>
              <p className="font-numeric text-2xl font-semibold text-text-primary">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-text-muted">Total gasto</p>
            </div>
          </div>
        )}
      </div>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                  Nenhuma compra registrada ainda.
                </td>
              </tr>
            )}
            {purchases.map((purchase) => (
              <tr key={purchase.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(purchase.created_at)}</td>
                <td className="px-4 py-3 text-text-primary">{purchase.supplier_name ?? "Não informado"}</td>
                <td className="px-4 py-3 text-right font-numeric font-medium text-text-primary">
                  {formatCurrency(purchase.total)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Link
                      href={`/compras/${purchase.id}`}
                      className="rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                      title="Ver detalhes"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={purchasePage.page}
          totalPages={purchasePage.totalPages}
          total={purchasePage.total}
          basePath="/compras"
          searchParams={{}}
        />
      </div>
    </div>
  );
}
