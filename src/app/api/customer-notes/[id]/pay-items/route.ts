import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import {
  PayNoteItems,
  PayNoteItemsValidationError,
  CustomerNoteNotFoundError,
} from "@/application/use-cases/customerNotes/PayNoteItems";
import { PaymentMethod } from "@/domain/entities/Sale";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  let body: { item_ids?: number[]; payment_method?: PaymentMethod };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!body.payment_method) {
    return NextResponse.json({ error: "Forma de pagamento é obrigatória." }, { status: 400 });
  }

  const useCase = new PayNoteItems(container.customerNoteRepository, container.saleRepository);
  try {
    const note = await useCase.execute(Number(id), {
      item_ids: (body.item_ids ?? []).map(Number),
      payment_method: body.payment_method,
    });
    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof PayNoteItemsValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof CustomerNoteNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/customer-notes/[id]/pay-items]", err);
    return NextResponse.json({ error: "Erro ao marcar itens como pagos." }, { status: 500 });
  }
}
