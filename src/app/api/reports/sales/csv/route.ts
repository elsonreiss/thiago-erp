import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { canViewFinancials } from "@/domain/entities/User";
import { buildCsv, csvResponse } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  const sales = await container.saleRepository.findAll({
    from: from ? `${from} 00:00:00` : undefined,
    to: to ? `${to} 23:59:59` : undefined,
  });

  const rows = sales.map((s) => [
    s.id,
    formatDateTime(s.created_at),
    s.customer_name ?? "Consumidor final",
    s.seller_name,
    PAYMENT_METHOD_LABELS[s.payment_method],
    s.discount,
    s.total,
  ]);

  const csv = buildCsv(
    ["ID", "Data", "Cliente", "Vendedor", "Forma de pagamento", "Desconto", "Total"],
    rows
  );

  return csvResponse("vendas.csv", csv);
}
