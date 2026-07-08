"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff } from "lucide-react";

export function ToggleActiveButton({ id, active }: { id: number; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = active ? "desativar" : "ativar";
    if (!confirm(`Deseja ${action} este usuário?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Erro ao atualizar usuário.");
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
      onClick={handleToggle}
      disabled={loading}
      title={active ? "Desativar" : "Ativar"}
      className={`flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
        active ? "text-danger hover:bg-danger-soft" : "text-success hover:bg-success-soft"
      }`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : active ? (
        <PowerOff size={14} />
      ) : (
        <Power size={14} />
      )}
      {active ? "Desativar" : "Ativar"}
    </button>
  );
}
