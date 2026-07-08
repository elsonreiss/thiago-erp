import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { ListBudgets } from "@/application/use-cases/budgets/ListBudgets";
import { CreateBudget, BudgetValidationError } from "@/application/use-cases/budgets/CreateBudget";
import { CreateBudgetInput } from "@/domain/repositories/BudgetRepository";
import { BudgetStatus } from "@/domain/entities/Budget";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const status = (request.nextUrl.searchParams.get("status") as BudgetStatus | null) ?? undefined;

  const useCase = new ListBudgets(container.budgetRepository);
  const budgets = await useCase.execute(status);

  return NextResponse.json({ budgets });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: Partial<CreateBudgetInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateBudgetInput = {
    customer_id: body.customer_id ?? null,
    user_id: user.id,
    discount: body.discount ?? "0.00",
    validity_date: body.validity_date ?? null,
    notes: body.notes ?? null,
    items: (body.items ?? []).map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: String(item.unit_price),
    })),
  };

  const useCase = new CreateBudget(container.budgetRepository);
  try {
    const budget = await useCase.execute(input);
    return NextResponse.json({ budget }, { status: 201 });
  } catch (err) {
    if (err instanceof BudgetValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/budgets]", err);
    return NextResponse.json({ error: "Erro ao criar orçamento." }, { status: 500 });
  }
}
