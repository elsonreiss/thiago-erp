import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { canViewFinancials } from "@/domain/entities/User";
import { CreateExpense, ExpenseValidationError } from "@/application/use-cases/expenses/CreateExpense";
import { CreateExpenseInput } from "@/domain/repositories/ExpenseRepository";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  const expenses = await container.expenseRepository.findAll(from, to);
  return NextResponse.json({ expenses });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  let body: Partial<CreateExpenseInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateExpenseInput = {
    description: body.description ?? "",
    category: body.category ?? "Outros",
    amount: body.amount ?? "0.00",
    expense_date: body.expense_date ?? new Date().toISOString().slice(0, 10),
    notes: body.notes ?? null,
  };

  const useCase = new CreateExpense(container.expenseRepository);
  try {
    const expense = await useCase.execute(input);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    if (err instanceof ExpenseValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/expenses]", err);
    return NextResponse.json({ error: "Erro ao criar despesa." }, { status: 500 });
  }
}
