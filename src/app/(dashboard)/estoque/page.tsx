import Link from "next/link";
import { Package, PackageX, PackageMinus, Plus, Pencil, Upload } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { DEFAULT_PRODUCT_CATEGORIES, getStockStatus, ProductStockStatus } from "@/domain/entities/Product";
import { formatCurrency } from "@/lib/format";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { DeleteProductButton } from "@/components/products/DeleteProductButton";
import { Pagination } from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";

interface SearchParams {
  search?: string;
  category?: string;
  stockStatus?: string;
  page?: string;
}

export default async function EstoquePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireUser();
  const params = await searchParams;
  const page = parsePage(params.page);

  const [productPage, total, outOfStock, lowStock] = await Promise.all([
    container.productRepository.findPage(
      {
        search: params.search,
        category: params.category,
        stockStatus: (params.stockStatus as ProductStockStatus) || undefined,
      },
      page,
      DEFAULT_PAGE_SIZE
    ),
    container.productRepository.countTotal(),
    container.productRepository.countOutOfStock(),
    container.productRepository.countLowStock(),
  ]);
  const products = productPage.items;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Estoque</h1>
          <p className="text-sm text-text-secondary">Produtos cadastrados na loja.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/estoque/importar"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <Upload size={16} /> Importar planilha
          </Link>
          <Link
            href="/estoque/novo"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            <Plus size={16} /> Novo produto
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Package} label="Total de produtos" value={total} accent="text-text-primary" />
        <KpiCard icon={PackageX} label="Em falta" value={outOfStock} accent="text-danger" />
        <KpiCard icon={PackageMinus} label="Estoque baixo" value={lowStock} accent="text-warning" />
      </div>

      <form className="price-tag-card flex flex-wrap items-end gap-3 rounded-xl p-4">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Buscar</label>
          <input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="Nome, código ou código de barras"
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Categoria</label>
          <select
            name="category"
            defaultValue={params.category ?? ""}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Todas</option>
            {DEFAULT_PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Status</label>
          <select
            name="stockStatus"
            defaultValue={params.stockStatus ?? ""}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Todos</option>
            <option value="em_falta">Em falta</option>
            <option value="estoque_baixo">Estoque baixo</option>
            <option value="ok">OK</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
        >
          Filtrar
        </button>
      </form>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium text-right">Qtd.</th>
              <th className="px-4 py-3 font-medium text-right">Preço compra</th>
              <th className="px-4 py-3 font-medium text-right">Preço venda</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-secondary">
                      {product.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package size={16} className="text-text-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">{product.name}</p>
                      <p className="truncate text-xs text-text-muted">{product.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{product.category}</td>
                <td className="px-4 py-3 text-right font-numeric">
                  {product.quantity} {product.unit}
                </td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(product.purchase_price)}</td>
                <td className="px-4 py-3 text-right font-numeric">{formatCurrency(product.sale_price)}</td>
                <td className="px-4 py-3">
                  <ProductStatusBadge status={getStockStatus(product)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/estoque/${product.id}`}
                      className="rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={productPage.page}
          totalPages={productPage.totalPages}
          total={productPage.total}
          basePath="/estoque"
          searchParams={{ search: params.search, category: params.category, stockStatus: params.stockStatus }}
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="price-tag-card flex items-center gap-4 rounded-xl p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-secondary">
        <Icon size={20} className={accent} />
      </div>
      <div>
        <p className="font-numeric text-2xl font-semibold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}
