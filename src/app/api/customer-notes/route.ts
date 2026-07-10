import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { ListCustomerNotes } from "@/application/use-cases/customerNotes/ListCustomerNotes";
import { CreateCustomerNote, CustomerNoteValidationError, CreditLimitExceededError } from "@/application/use-cases/customerNotes/CreateCustomerNote";
import { CreateCustomerNoteInput } from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteStatus } from "@/domain/entities/CustomerNote";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const customerIdParam = request.nextUrl.searchParams.get("customerId");
  const status = (request.nextUrl.searchParams.get("status") as CustomerNoteStatus | null) ?? undefined;

  const useCase = new ListCustomerNotes(container.customerNoteRepository);
  try {
    const notes = await useCase.execute({
      customerId: customerIdParam ? Number(customerIdParam) : undefined,
      status,
    });
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("[GET /api/customer-notes]", err);
    return NextResponse.json({ error: "Erro ao listar notas." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: Partial<CreateCustomerNoteInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateCustomerNoteInput = {
    customer_id: Number(body.customer_id),
    user_id: user.id,
    description: body.description ?? null,
    due_date: body.due_date ?? null,
    items: (body.items ?? []).map((item) => ({
      product_id: item.product_id ? Number(item.product_id) : null,
      product_name: item.product_name ?? undefined,
      quantity: Number(item.quantity),
      unit_price: String(item.unit_price),
    })),
  };
  const overrideLimit = Boolean((body as { override_limit?: boolean }).override_limit);

  const useCase = new CreateCustomerNote(container.customerNoteRepository, container.customerRepository);
  try {
    const note = await useCase.execute(input, overrideLimit);
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    if (err instanceof CreditLimitExceededError) {
      return NextResponse.json({ error: err.message, code: "CREDIT_LIMIT_EXCEEDED" }, { status: 409 });
    }
    if (err instanceof CustomerNoteValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/customer-notes]", err);
    return NextResponse.json({ error: "Erro ao registrar nota." }, { status: 500 });
  }
}
