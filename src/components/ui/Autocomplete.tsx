"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Search, X } from "lucide-react";

/**
 * Campo de busca com autocomplete genérico — usado em Vendas/Compras/Orçamentos
 * pra escolher produto/cliente/fornecedor, e no formulário de produto pra
 * escolher fornecedor. Nunca é um <select> simples: com estoque grande listar
 * tudo de uma vez seria inviável de navegar.
 */
export interface AutocompleteProps<T> {
  searchUrl: string;
  responseKey: string;
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string;
  getKey: (item: T) => string | number;
  onSelect: (item: T) => void;
  placeholder?: string;
  minChars?: number;
  disabled?: boolean;
}

export function Autocomplete<T>({
  searchUrl,
  responseKey,
  getLabel,
  getSubLabel,
  getKey,
  onSelect,
  placeholder = "Buscar...",
  minChars = 1,
  disabled = false,
}: AutocompleteProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (term.length < minChars) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${searchUrl}?q=${encodeURIComponent(term)}`);
        let data: Record<string, unknown> = {};
        try {
          data = await res.json();
        } catch {
          // resposta sem corpo JSON (ex: erro 500 sem json) — segue com data vazio
        }

        if (!res.ok) {
          const message = typeof data.error === "string" ? data.error : `Erro ao buscar (HTTP ${res.status}).`;
          setError(message);
          setResults([]);
          return;
        }

        setError(null);
        setResults((data[responseKey] as T[]) ?? []);
      } catch {
        setError("Erro de conexão ao buscar. Tente novamente.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, searchUrl, responseKey, minChars]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-bg-secondary py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setError(null);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
        {loading && (
          <Loader2 size={14} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-text-muted" />
        )}
      </div>

      {open && query.trim().length >= minChars && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {error && !loading && (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-danger">
              <AlertTriangle size={14} className="shrink-0" /> {error}
            </p>
          )}
          {!error && results.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-text-muted">Nenhum resultado.</p>
          )}
          {!error &&
            results.map((item) => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start px-4 py-2.5 text-left text-sm hover:bg-bg-secondary"
              >
                <span className="text-text-primary">{getLabel(item)}</span>
                {getSubLabel && <span className="text-xs text-text-muted">{getSubLabel(item)}</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
