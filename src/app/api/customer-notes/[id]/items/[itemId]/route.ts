import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { RemoveNoteItem } from "@/application/use-cases/customerNotes/RemoveNoteItem";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id, itemId } = await params;

  const useCase = new RemoveNoteItem(container.customerNoteRepository);
  try {
    const note = await useCase.execute(Number(id), Number(itemId));
    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[DELETE /api/customer-notes/[id]/items/[itemId]]", err);
    return NextResponse.json({ error: "Erro ao remover item." }, { status: 500 });
  }
}
