import { requireUser } from "@/lib/auth";
import { ProfilePhotoForm } from "@/components/profile/ProfilePhotoForm";

export default async function PerfilPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Meu perfil</h1>
        <p className="text-sm text-text-secondary">Troque sua foto de perfil. Ela é redimensionada no navegador antes de enviar.</p>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <ProfilePhotoForm user={user} />
      </div>
    </div>
  );
}
