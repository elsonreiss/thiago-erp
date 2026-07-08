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
    const costValue = (parseFloat(p.purchase_price) * p.quantity).toFixed(2);
    const saleValue = (parseFloat(p.sale_price) * p.quantity).toFixed(2);
    return [p.code, p.name, p.category, p.quantity, p.purchase_price, costValue, p.sale_price, saleValue];
  });

  const csv = buildCsv(
    ["Código", "Produto", "Categoria", "Quantidade", "Custo unit.", "Valor em custo", "Preço venda", "Valor em venda"],
    rows
  );

  return csvResponse("valorizacao-estoque.csv", csv);
}
