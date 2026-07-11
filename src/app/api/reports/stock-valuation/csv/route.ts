import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { canViewFinancials } from "@/domain/entities/User";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const products = await container.productRepository.findAll({ activeOnly: false });

  const rows = products.map((p) => {
    const costValueNum = parseFloat(p.purchase_price) * p.quantity;
    const saleValueNum = parseFloat(p.sale_price) * p.quantity;
    const profitNum = saleValueNum - costValueNum;
    return [
      p.code,
      p.name,
      p.category,
      p.quantity,
      p.purchase_price,
      costValueNum.toFixed(2),
      p.sale_price,
      saleValueNum.toFixed(2),
      profitNum.toFixed(2),
    ];
  });

  const csv = buildCsv(
    [
      "Código",
      "Produto",
      "Categoria",
      "Quantidade",
      "Custo unit.",
      "Valor em custo",
      "Preço venda",
      "Valor em venda",
      "Lucro potencial",
    ],
    rows
  );

  return csvResponse("valorizacao-estoque.csv", csv);
}
