"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao excluir produto.");
        setShowConfirm(false);
        return;
      }
      router.refresh();
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        title="Excluir"
        className="rounded-lg p-2 text-text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger shadow-md">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={showConfirm}
        title="Excluir produto"
        message={`Excluir o produto "${name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
