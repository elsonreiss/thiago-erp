"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

/**
 * Campo pra anotar o número/chave da NFC-e emitida no sistema fiscal externo —
 * este ERP não emite nota fiscal, só guarda a referência pra consulta/rastreio.
 */
export function NfceNumberField({ saleId, initialValue }: { saleId: number; initialValue: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfce_number: value.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="price-tag-card rounded-xl p-5 print:hidden">
      <p className="text-xs text-text-muted">Nº / chave da NFC-e (emitida no sistema fiscal)</p>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="Cole aqui o número ou a chave de acesso..."
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-secondary disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Salvar
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {saved && !error && <p className="mt-1 text-xs text-success">Salvo.</p>}
    </div>
  );
}
