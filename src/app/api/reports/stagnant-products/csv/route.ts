import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { canViewFinancials } from "@/domain/entities/User";
import { buildCsv, csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const days = Number(request.nextUrl.searchParams.get("days") ?? "60");
  const products = await container.productRepository.stagnant(days);

  const rows = products.map((p) => [
    p.code,
    p.name,
    p.category,
    p.quantity,
    p.sale_price,
    formatDate(p.updated_at),
  ]);

  const csv = buildCsv(
    ["Código", "Produto", "Categoria", "Quantidade", "Preço venda", "Última atualização"],
    rows
  );

  return csvResponse("produtos-parados.csv", csv);
}
