import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { isAdmin, toPublicUser } from "@/domain/entities/User";
import {
  UpdateUser,
  UpdateUserRequest,
  UserNotFoundError,
  SelfLockoutError,
} from "@/application/use-cases/users/UpdateUser";
import { UserValidationError, DuplicateUserEmailError } from "@/application/use-cases/users/CreateUser";
import { logAudit } from "@/lib/auditLog";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const { id } = await params;

  let body: UpdateUserRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const existing = await container.userRepository.findById(Number(id));

  const useCase = new UpdateUser(container.userRepository);
  try {
    const updated = await useCase.execute(Number(id), body, user.id);

    if (existing && (body.role !== undefined || body.active !== undefined)) {
      const changes: string[] = [];
      if (body.role !== undefined && body.role !== existing.role) {
        changes.push(`papel: ${existing.role} → ${updated.role}`);
      }
      if (body.active !== undefined && body.active !== existing.active) {
        changes.push(updated.active ? "usuário ativado" : "usuário desativado");
      }
      if (changes.length > 0) {
        await logAudit({
          userId: user.id,
          userName: user.name,
          action: "update_permissions",
          entityType: "user",
          entityId: updated.id,
          details: `${updated.name}: ${changes.join(", ")}`,
        });
      }
    }

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof SelfLockoutError || err instanceof UserValidationError || err instanceof DuplicateUserEmailError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[PUT /api/users/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar usuário." }, { status: 500 });
  }
}
