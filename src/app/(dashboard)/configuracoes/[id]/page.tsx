import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { container } from "@/container";
import { toPublicUser } from "@/domain/entities/User";
import { UserForm } from "@/components/settings/UserForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditarUsuarioPage({ params }: Params) {
  const currentUser = await requireAdmin();
  const { id } = await params;

  const user = await container.userRepository.findById(Number(id));
  if (!user) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Editar usuário</h1>
        <p className="text-sm text-text-secondary">{user.name}</p>
      </div>
      <UserForm user={toPublicUser(user)} isSelf={user.id === currentUser.id} />
    </div>
  );
}
