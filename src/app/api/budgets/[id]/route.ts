import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { GetBudget } from "@/application/use-cases/budgets/GetBudget";
import { DeleteBudget, BudgetNotFoundError } from "@/application/use-cases/budgets/DeleteBudget";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new GetBudget(container.budgetRepository);
  const budget = await useCase.execute(Number(id));
  if (!budget) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });

  return NextResponse.json({ budget });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new DeleteBudget(container.budgetRepository);
  try {
    await useCase.execute(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof BudgetNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[DELETE /api/budgets/[id]]", err);
    return NextResponse.json({ error: "Erro ao excluir orçamento." }, { status: 500 });
  }
}
