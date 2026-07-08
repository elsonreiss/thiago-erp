"use client";

import { useMemo, useState } from "react";
import { Search, Truck } from "lucide-react";
import { PurchaseWithItems } from "@/domain/entities/Purchase";
import { formatCurrency, formatDateTime } from "@/lib/format";

/**
 * Painel de consulta às últimas notas de compra, exibido ao lado do
 * formulário de "Novo produto" — ajuda a conferir preço/fornecedor de uma
 * entrega recente enquanto cadastra o item no estoque.
 */
export function RecentPurchasesPanel({ purchases }: { purchases: PurchaseWithItems[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return purchases;
    return purchases.filter((purchase) => {
      if (purchase.supplier_name?.toLowerCase().includes(term)) return true;
      return purchase.items.some((item) => item.product_name.toLowerCase().includes(term));
    });
  }, [purchases, query]);

  return (
    <div className="price-tag-card flex max-h-[calc(100vh-8rem)] flex-col rounded-xl p-5 lg:sticky lg:top-20">
      <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-text-primary">
        <Truck size={17} className="text-accent" /> Notas de compra recentes
      </h2>
      <p className="mb-3 text-xs text-text-secondary">
        Consulte preços e fornecedores de entregas recentes enquanto cadastra o item.
      </p>

      <div className="relative mb-3">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por produto ou fornecedor..."
          className="w-full rounded-lg border border-border bg-bg-secondary py-1.5 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">Nenhuma nota encontrada.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((purchase) => (
              <div key={purchase.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {purchase.supplier_name ?? "Não informado"}
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">{formatDateTime(purchase.created_at)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {purchase.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate text-text-secondary">
                        {item.product_name} <span className="text-text-muted">× {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-numeric text-text-primary">
                        {formatCurrency(item.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
