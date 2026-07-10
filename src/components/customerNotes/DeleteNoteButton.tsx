"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DeleteNoteButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/customer-notes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao excluir nota.");
        setShowConfirm(false);
        return;
      }
      router.push("/notas-clientes");
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
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        Excluir nota
      </button>
      <ConfirmDialog
        open={showConfirm}
        title="Excluir nota"
        message="Excluir esta nota? Os itens voltam para o estoque. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
