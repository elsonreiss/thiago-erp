import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { canViewFinancials } from "@/domain/entities/User";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const year = Number(request.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()));
  const from = `${year}-01-01 00:00:00`;
  const to = `${year}-12-31 23:59:59`;

  const revenueByMonth = await container.saleRepository.revenueByMonth(from, to);
  const rows = revenueByMonth.map((r) => [r.month, r.total.toFixed(2)]);

  const csv = buildCsv(["Mês", "Receita"], rows);

  return csvResponse(`receita-mensal-${year}.csv`, csv);
}
