"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function RemoveNoteItemButton({ noteId, itemId }: { noteId: number; itemId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/customer-notes/${noteId}/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao remover item.");
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
        className="rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-60"
        title="Remover item"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger shadow-md">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={showConfirm}
        title="Remover item"
        message="Remover este item da nota? A quantidade volta para o estoque."
        confirmLabel="Remover"
        loading={loading}
        onConfirm={handleRemove}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
