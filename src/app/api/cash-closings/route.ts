import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { RegisterCashClosing, CashClosingValidationError } from "@/application/use-cases/cashClosings/RegisterCashClosing";
import { canViewFinancials } from "@/domain/entities/User";
import { UpsertCashClosingInput } from "@/domain/repositories/CashClosingRepository";
import { logAudit } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão para registrar fechamento de caixa." }, { status: 403 });
  }

  let body: Partial<UpsertCashClosingInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!body.closing_date) {
    return NextResponse.json({ error: "Data é obrigatória." }, { status: 400 });
  }

  const input: UpsertCashClosingInput = {
    closing_date: body.closing_date,
    user_id: user.id,
    opening_amount: body.opening_amount ?? "0.00",
    counted_cash: body.counted_cash ?? "0.00",
    notes: body.notes ?? null,
  };

  const useCase = new RegisterCashClosing(container.cashClosingRepository, container.saleRepository);
  try {
    const closing = await useCase.execute(input);
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "register",
      entityType: "cash_closing",
      entityId: closing.id,
      details: `Fechamento de caixa de ${input.closing_date} (contado: ${closing.counted_cash}, diferença: ${closing.difference})`,
    });
    return NextResponse.json({ closing }, { status: 201 });
  } catch (err) {
    if (err instanceof CashClosingValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/cash-closings]", err);
    return NextResponse.json({ error: "Erro ao registrar fechamento." }, { status: 500 });
  }
}
