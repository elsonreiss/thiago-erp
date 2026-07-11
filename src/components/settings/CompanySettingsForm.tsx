"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CompanySettings } from "@/domain/entities/CompanySettings";

const TAX_REGIMES = ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real", "Outro"];

export function CompanySettingsForm({ settings }: { settings: CompanySettings }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      legal_name: String(form.get("legal_name") ?? "").trim(),
      trade_name: String(form.get("trade_name") ?? "").trim(),
      cnpj: String(form.get("cnpj") ?? "").trim(),
      state_registration: String(form.get("state_registration") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      state: String(form.get("state") ?? "").trim(),
      zip_code: String(form.get("zip_code") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      tax_regime: String(form.get("tax_regime") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/company-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar dados da empresa.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {success && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          Dados salvos. Já valem para os próximos comprovantes impressos.
        </p>
      )}

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Identificação</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Razão social *">
            <input name="legal_name" required defaultValue={settings.legal_name} className={inputClass} />
          </Field>
          <Field label="Nome fantasia">
            <input name="trade_name" defaultValue={settings.trade_name ?? ""} className={inputClass} />
          </Field>
          <Field label="CNPJ">
            <input name="cnpj" defaultValue={settings.cnpj ?? ""} placeholder="00.000.000/0000-00" className={inputClass} />
          </Field>
          <Field label="Inscrição estadual">
            <input name="state_registration" defaultValue={settings.state_registration ?? ""} className={inputClass} />
          </Field>
          <Field label="Regime tributário">
            <select name="tax_regime" defaultValue={settings.tax_regime ?? ""} className={inputClass}>
              <option value="">Não informado</option>
              {TAX_REGIMES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Telefone">
            <input name="phone" defaultValue={settings.phone ?? ""} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Endereço</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Endereço" className="sm:col-span-2 lg:col-span-2">
            <input name="address" defaultValue={settings.address ?? ""} className={inputClass} />
          </Field>
          <Field label="Cidade">
            <input name="city" defaultValue={settings.city ?? ""} className={inputClass} />
          </Field>
          <Field label="UF">
            <input name="state" maxLength={2} defaultValue={settings.state ?? ""} className={inputClass} />
          </Field>
          <Field label="CEP">
            <input name="zip_code" defaultValue={settings.zip_code ?? ""} className={inputClass} />
          </Field>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Esses dados aparecem no cabeçalho dos comprovantes/PDFs impressos pelo sistema. Este sistema não emite
        nota fiscal — a emissão fiscal continua sendo feita no sistema próprio para isso.
      </p>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {children}
    </label>
  );
}
