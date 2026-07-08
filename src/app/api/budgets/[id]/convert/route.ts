import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import {
  ConvertBudgetToSale,
  BudgetNotFoundError,
  BudgetAlreadyConvertedError,
} from "@/application/use-cases/budgets/ConvertBudgetToSale";
import { PaymentMethod } from "@/domain/entities/Sale";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  let body: { payment_method?: PaymentMethod };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const useCase = new ConvertBudgetToSale(container.budgetRepository, container.saleRepository);
  try {
    const sale = await useCase.execute(Number(id), {
      user_id: user.id,
      payment_method: body.payment_method ?? "dinheiro",
    });
    return NextResponse.json({ sale }, { status: 201 });
  } catch (err) {
    if (err instanceof BudgetNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof BudgetAlreadyConvertedError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/budgets/[id]/convert]", err);
    return NextResponse.json({ error: "Erro ao converter orçamento em venda." }, { status: 500 });
  }
}
