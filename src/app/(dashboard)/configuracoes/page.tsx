import Link from "next/link";
import { Building2, Pencil, Plus, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { container } from "@/container";
import { UserRoleBadge } from "@/components/settings/UserRoleBadge";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { ToggleActiveButton } from "@/components/settings/ToggleActiveButton";

export default async function ConfiguracoesPage() {
  const currentUser = await requireAdmin();
  const users = await container.userRepository.findAll();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Configurações</h1>
          <p className="text-sm text-text-secondary">Gestão de usuários e permissões.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/configuracoes/empresa"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <Building2 size={16} /> Dados da empresa
          </Link>
          <Link
            href="/configuracoes/privacidade"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            <ShieldCheck size={16} /> Privacidade (LGPD)
          </Link>
          <Link
            href="/configuracoes/novo"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            <Plus size={16} /> Novo usuário
          </Link>
        </div>
      </div>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={user} size={30} />
                    <span className="text-text-primary">
                      {user.name}
                      {user.id === currentUser.id && (
                        <span className="ml-1.5 text-xs text-text-muted">(você)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.active ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                    }`}
                  >
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/configuracoes/${user.id}`}
                      className="rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </Link>
                    {user.id !== currentUser.id && (
                      <ToggleActiveButton id={user.id} active={user.active} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
