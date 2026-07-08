"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { PublicUser } from "@/domain/entities/User";
import { resizeAndCompressImage } from "@/lib/image";

export function ProfilePhotoForm({ user }: { user: PublicUser }) {
  const [photo, setPhoto] = useState(user.photo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSaving(true);
    try {
      const compressed = await resizeAndCompressImage(file);
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: compressed }),
      });
      if (!res.ok) throw new Error("Falha ao salvar a foto.");
      setPhoto(compressed);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar a imagem.");
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ui-primary text-xl font-semibold text-ui-primary-foreground">
            {initials || <UserIcon size={28} />}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow hover:bg-accent-hover disabled:opacity-60"
          aria-label="Trocar foto"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
      <div>
        <p className="font-medium text-text-primary">{user.name}</p>
        <p className="text-sm text-text-muted">{user.email}</p>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
