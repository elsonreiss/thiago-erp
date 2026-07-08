import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import {
  UpdateBudgetStatus,
  BudgetNotFoundError,
  BudgetAlreadyConvertedError,
} from "@/application/use-cases/budgets/UpdateBudgetStatus";
import { BudgetStatus } from "@/domain/entities/Budget";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  let body: { status?: BudgetStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!body.status) return NextResponse.json({ error: "Status é obrigatório." }, { status: 400 });

  const useCase = new UpdateBudgetStatus(container.budgetRepository);
  try {
    const budget = await useCase.execute(Number(id), body.status);
    return NextResponse.json({ budget });
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
    console.error("[PUT /api/budgets/[id]/status]", err);
    return NextResponse.json({ error: "Erro ao atualizar status." }, { status: 500 });
  }
}
