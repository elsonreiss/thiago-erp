"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function RemoveNoteItemButton({ noteId, itemId }: { noteId: number; itemId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Remover este item da nota? A quantidade volta para o estoque.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customer-notes/${noteId}/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erro ao remover item.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-60"
      title="Remover item"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}
