import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { GetSale } from "@/application/use-cases/sales/GetSale";
import { DeleteSale, SaleNotFoundError } from "@/application/use-cases/sales/DeleteSale";
import { canViewFinancials, isAdmin } from "@/domain/entities/User";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new GetSale(container.saleRepository);
  const sale = await useCase.execute(Number(id));
  if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });

  // funcionário só pode ver a própria venda.
  if (!canViewFinancials(user.role) && sale.user_id !== user.id) {
    return NextResponse.json({ error: "Sem permissão para ver esta venda." }, { status: 403 });
  }

  return NextResponse.json({ sale });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Apenas administradores podem excluir vendas." }, { status: 403 });
  }
  const { id } = await params;

  const useCase = new DeleteSale(container.saleRepository);
  try {
    await useCase.execute(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SaleNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[DELETE /api/sales/[id]]", err);
    return NextResponse.json({ error: "Erro ao excluir venda." }, { status: 500 });
  }
}
