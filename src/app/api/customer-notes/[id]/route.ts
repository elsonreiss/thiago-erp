import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { isAdmin } from "@/domain/entities/User";
import { logAudit } from "@/lib/auditLog";
import {
  DeleteCustomerNote,
  CustomerNoteNotFoundError,
  CustomerNoteAlreadyPaidError,
} from "@/application/use-cases/customerNotes/DeleteCustomerNote";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const note = await container.customerNoteRepository.findById(Number(id));
  if (!note) return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });

  return NextResponse.json({ note });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir notas." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await container.customerNoteRepository.findById(Number(id));

  const useCase = new DeleteCustomerNote(container.customerNoteRepository);
  try {
    await useCase.execute(Number(id));
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "delete",
      entityType: "customer_note",
      entityId: Number(id),
      details: existing ? `Nota de fiado excluída (cliente: ${existing.customer_name}, total: ${existing.total})` : null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CustomerNoteNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof CustomerNoteAlreadyPaidError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[DELETE /api/customer-notes/[id]]", err);
    return NextResponse.json({ error: "Erro ao excluir nota." }, { status: 500 });
  }
}
