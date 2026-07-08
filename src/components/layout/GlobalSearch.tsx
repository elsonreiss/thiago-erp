"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Users, Truck, Loader2 } from "lucide-react";

interface SearchResult {
  type: "produto" | "cliente" | "fornecedor";
  id: number;
  title: string;
  subtitle: string;
  href: string;
}

const ICONS = { produto: Package, cliente: Users, fornecedor: Truck };

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Buscar produtos, clientes, fornecedores..."
          className="w-full rounded-lg border border-border bg-bg-secondary py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-muted" />
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {results.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-text-muted">Nenhum resultado para &ldquo;{query}&rdquo;.</p>
          )}
          {results.map((result) => {
            const Icon = ICONS[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  router.push(result.href);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-bg-secondary"
              >
                <Icon size={16} className="shrink-0 text-text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-text-primary">{result.title}</span>
                  <span className="block truncate text-xs text-text-muted">{result.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
