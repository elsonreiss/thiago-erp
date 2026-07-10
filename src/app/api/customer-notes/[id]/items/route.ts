import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { AddNoteItem, CustomerNoteItemValidationError } from "@/application/use-cases/customerNotes/AddNoteItem";
import { CreditLimitExceededError } from "@/application/use-cases/customerNotes/CreateCustomerNote";
import { CreateCustomerNoteItemInput } from "@/domain/repositories/CustomerNoteRepository";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  let body: Partial<CreateCustomerNoteItemInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateCustomerNoteItemInput = {
    product_id: body.product_id ? Number(body.product_id) : null,
    product_name: body.product_name ?? undefined,
    quantity: Number(body.quantity),
    unit_price: String(body.unit_price),
  };
  const overrideLimit = Boolean((body as { override_limit?: boolean }).override_limit);

  const useCase = new AddNoteItem(container.customerNoteRepository, container.customerRepository);
  try {
    const note = await useCase.execute(Number(id), input, overrideLimit);
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    if (err instanceof CreditLimitExceededError) {
      return NextResponse.json({ error: err.message, code: "CREDIT_LIMIT_EXCEEDED" }, { status: 409 });
    }
    if (err instanceof CustomerNoteItemValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/customer-notes/[id]/items]", err);
    return NextResponse.json({ error: "Erro ao adicionar item." }, { status: 500 });
  }
}
