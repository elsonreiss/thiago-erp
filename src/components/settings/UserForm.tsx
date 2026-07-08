"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PublicUser, UserRole } from "@/domain/entities/User";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "funcionario", label: "Funcionário" },
];

export function UserForm({ user, isSelf }: { user?: PublicUser; isSelf?: boolean }) {
  const isEditing = !!user;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "").trim();

    const payload: Record<string, unknown> = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
    };
    // Campo de papel vem desabilitado (e portanto ausente do FormData) quando
    // o usuário está editando a própria conta — nesse caso não enviamos o
    // campo, mantendo o papel atual intacto no servidor.
    if (!isSelf) {
      payload.role = String(form.get("role") ?? "funcionario");
    }
    if (password) payload.password = password;
    if (!isEditing) payload.active = true;

    try {
      const res = await fetch(isEditing ? `/api/users/${user!.id}` : "/api/users", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar usuário.");
        return;
      }
      router.push("/configuracoes");
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
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Dados do usuário</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome *">
            <input name="name" required defaultValue={user?.name} className={inputClass} />
          </Field>
          <Field label="E-mail *">
            <input name="email" type="email" required defaultValue={user?.email} className={inputClass} />
          </Field>
          <Field label="Papel *">
            <select
              name="role"
              required
              defaultValue={user?.role ?? "funcionario"}
              disabled={isSelf}
              className={`${inputClass} disabled:opacity-60`}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {isSelf && (
              <span className="text-xs text-text-muted">Você não pode alterar o próprio papel.</span>
            )}
          </Field>
          <Field label={isEditing ? "Nova senha (opcional)" : "Senha *"}>
            <input
              name="password"
              type="password"
              required={!isEditing}
              minLength={6}
              placeholder={isEditing ? "Deixe em branco para manter" : undefined}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/configuracoes")}
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
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {children}
    </label>
  );
}
