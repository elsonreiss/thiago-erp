import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { UpdateOwnProfilePhoto } from "@/application/use-cases/auth/UpdateOwnProfilePhoto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: { photo?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (typeof body.photo !== "string" && body.photo !== null) {
    return NextResponse.json({ error: "Campo 'photo' é obrigatório (string base64 ou null)." }, { status: 400 });
  }

  const useCase = new UpdateOwnProfilePhoto(container.userRepository);
  const updated = await useCase.execute(user.id, body.photo);

  return NextResponse.json({ user: updated });
}
