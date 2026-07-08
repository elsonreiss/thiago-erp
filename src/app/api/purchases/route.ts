import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { ListPurchases } from "@/application/use-cases/purchases/ListPurchases";
import { CreatePurchase, PurchaseValidationError } from "@/application/use-cases/purchases/CreatePurchase";
import { CreatePurchaseInput } from "@/domain/repositories/PurchaseRepository";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const useCase = new ListPurchases(container.purchaseRepository);
  const purchases = await useCase.execute();

  return NextResponse.json({ purchases });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: Partial<CreatePurchaseInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreatePurchaseInput = {
    supplier_id: body.supplier_id ?? null,
    user_id: user.id,
    notes: body.notes ?? null,
    items: (body.items ?? []).map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: String(item.unit_price),
    })),
  };

  const useCase = new CreatePurchase(container.purchaseRepository);
  try {
    const purchase = await useCase.execute(input);
    return NextResponse.json({ purchase }, { status: 201 });
  } catch (err) {
    if (err instanceof PurchaseValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/purchases]", err);
    return NextResponse.json({ error: "Erro ao registrar compra." }, { status: 500 });
  }
}
