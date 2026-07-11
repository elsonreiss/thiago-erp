"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Supplier } from "@/domain/entities/Supplier";
import { isValidCNPJ } from "@/lib/documentValidation";

const BRAZIL_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const isEditing = !!supplier;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const cnpjValue = String(form.get("cnpj") ?? "").trim();
    if (cnpjValue && !isValidCNPJ(cnpjValue)) {
      setError("CNPJ inválido — confira os números digitados.");
      setSaving(false);
      return;
    }
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      cnpj: cnpjValue || null,
      contact_name: String(form.get("contact_name") ?? "").trim() || null,
      phone: String(form.get("phone") ?? "").trim() || null,
      whatsapp: String(form.get("whatsapp") ?? "").trim() || null,
      email: String(form.get("email") ?? "").trim() || null,
      address: String(form.get("address") ?? "").trim() || null,
      city: String(form.get("city") ?? "").trim() || null,
      state: String(form.get("state") ?? "").trim() || null,
      notes: String(form.get("notes") ?? "").trim() || null,
    };

    try {
      const res = await fetch(isEditing ? `/api/suppliers/${supplier!.id}` : "/api/suppliers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar fornecedor.");
        return;
      }
      router.push("/fornecedores");
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

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Dados do fornecedor</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome / Razão social *" className="sm:col-span-2">
            <input name="name" required defaultValue={supplier?.name} className={inputClass} />
          </Field>
          <Field label="CNPJ">
            <input name="cnpj" defaultValue={supplier?.cnpj ?? ""} className={inputClass} />
          </Field>
          <Field label="Pessoa de contato">
            <input name="contact_name" defaultValue={supplier?.contact_name ?? ""} className={inputClass} />
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" defaultValue={supplier?.email ?? ""} className={inputClass} />
          </Field>
          <Field label="Telefone">
            <input name="phone" defaultValue={supplier?.phone ?? ""} className={inputClass} />
          </Field>
          <Field label="WhatsApp">
            <input name="whatsapp" defaultValue={supplier?.whatsapp ?? ""} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Endereço</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Endereço" className="sm:col-span-3">
            <input name="address" defaultValue={supplier?.address ?? ""} className={inputClass} />
          </Field>
          <Field label="Cidade">
            <input name="city" defaultValue={supplier?.city ?? ""} className={inputClass} />
          </Field>
          <Field label="Estado">
            <select name="state" defaultValue={supplier?.state ?? ""} className={inputClass}>
              <option value="">-</option>
              {BRAZIL_STATES.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Observações</h2>
        <textarea name="notes" rows={3} defaultValue={supplier?.notes ?? ""} className={inputClass} />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/fornecedores")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar fornecedor"}
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
