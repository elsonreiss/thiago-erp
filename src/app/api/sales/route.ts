import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { ListSales } from "@/application/use-cases/sales/ListSales";
import { CreateSale, SaleValidationError } from "@/application/use-cases/sales/CreateSale";
import { CreateSaleInput } from "@/domain/repositories/SaleRepository";
import { canViewFinancials } from "@/domain/entities/User";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const customerId = params.get("customerId") ? Number(params.get("customerId")) : undefined;

  // funcionário só pode ver as próprias vendas; admin/gerente podem filtrar por vendedor.
  let userId: number | undefined;
  if (!canViewFinancials(user.role)) {
    userId = user.id;
  } else if (params.get("userId")) {
    userId = Number(params.get("userId"));
  }

  const useCase = new ListSales(container.saleRepository);
  const sales = await useCase.execute({ from, to, userId, customerId });

  return NextResponse.json({ sales });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: Partial<CreateSaleInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateSaleInput = {
    customer_id: body.customer_id ?? null,
    // vendedor é sempre o usuário autenticado — nunca vem do client.
    user_id: user.id,
    payment_method: body.payment_method ?? "dinheiro",
    discount: body.discount ?? "0.00",
    notes: body.notes ?? null,
    items: (body.items ?? []).map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: String(item.unit_price),
    })),
  };

  const useCase = new CreateSale(container.saleRepository);
  try {
    const sale = await useCase.execute(input);
    return NextResponse.json({ sale }, { status: 201 });
  } catch (err) {
    if (err instanceof SaleValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/sales]", err);
    return NextResponse.json({ error: "Erro ao registrar venda." }, { status: 500 });
  }
}
