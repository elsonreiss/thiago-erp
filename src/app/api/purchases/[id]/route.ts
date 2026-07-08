import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { GetPurchase } from "@/application/use-cases/purchases/GetPurchase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new GetPurchase(container.purchaseRepository);
  const purchase = await useCase.execute(Number(id));
  if (!purchase) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });

  return NextResponse.json({ purchase });
}
