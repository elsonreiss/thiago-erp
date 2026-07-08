"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

/** Exclui a venda e devolve os itens ao estoque. Ação restrita a administradores (checado também no servidor). */
export function DeleteSaleButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    if (
      !confirm(
        `Excluir a venda #${id}? O estoque dos itens vendidos será devolvido automaticamente. Essa ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao excluir venda.");
        return;
      }
      router.push("/vendas");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        {loading ? "Excluindo..." : "Excluir venda"}
      </button>
    </div>
  );
}
