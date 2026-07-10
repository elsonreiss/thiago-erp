import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}

/** Paginação server-side simples (Anterior/Próxima), preservando os outros filtros da URL. */
export function Pagination({ page, totalPages, total, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) sp.set(key, value);
    }
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <span className="text-xs text-text-muted">{total} registro{total === 1 ? "" : "s"} no total</span>
      <div className="flex items-center gap-2">
        <Link
          href={hasPrev ? hrefFor(page - 1) : "#"}
          aria-disabled={!hasPrev}
          tabIndex={hasPrev ? undefined : -1}
          className={`flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-secondary ${
            hasPrev ? "" : "pointer-events-none opacity-40"
          }`}
        >
          <ChevronLeft size={14} /> Anterior
        </Link>
        <span className="text-xs text-text-muted">
          Página {page} de {totalPages}
        </span>
        <Link
          href={hasNext ? hrefFor(page + 1) : "#"}
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
          className={`flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-secondary ${
            hasNext ? "" : "pointer-events-none opacity-40"
          }`}
        >
          Próxima <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
