import { requireAdmin } from "@/lib/auth";
import { UserForm } from "@/components/settings/UserForm";

export default async function NovoUsuarioPage() {
  await requireAdmin();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Novo usuário</h1>
        <p className="text-sm text-text-secondary">Cadastre um novo usuário do sistema.</p>
      </div>
      <UserForm />
    </div>
  );
}
