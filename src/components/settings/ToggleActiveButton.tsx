"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function ToggleActiveButton({ id, active }: { id: number; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao atualizar usuário.");
        setShowConfirm(false);
        return;
      }
      router.refresh();
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  const action = active ? "desativar" : "ativar";

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
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
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger shadow-md">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={showConfirm}
        title={active ? "Desativar usuário" : "Ativar usuário"}
        message={`Deseja ${action} este usuário?`}
        confirmLabel={active ? "Desativar" : "Ativar"}
        danger={active}
        loading={loading}
        onConfirm={handleToggle}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
