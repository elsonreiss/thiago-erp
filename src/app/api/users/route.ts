import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { isAdmin, toPublicUser } from "@/domain/entities/User";
import { CreateUser, CreateUserRequest, UserValidationError, DuplicateUserEmailError } from "@/application/use-cases/users/CreateUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const users = await container.userRepository.findAll();
  return NextResponse.json({ users: users.map(toPublicUser) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  let body: Partial<CreateUserRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const useCase = new CreateUser(container.userRepository);
  try {
    const created = await useCase.execute({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      role: body.role ?? "funcionario",
    });
    return NextResponse.json({ user: toPublicUser(created) }, { status: 201 });
  } catch (err) {
    if (err instanceof UserValidationError || err instanceof DuplicateUserEmailError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: "Erro ao criar usuário." }, { status: 500 });
  }
}
