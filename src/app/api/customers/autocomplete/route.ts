import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const term = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (term.length < 1) return NextResponse.json({ customers: [] });

  try {
    const customers = await container.customerRepository.searchForAutocomplete(term, 15);
    return NextResponse.json({ customers });
  } catch (err) {
    console.error("[GET /api/customers/autocomplete]", err);
    return NextResponse.json({ error: "Erro ao buscar clientes." }, { status: 500 });
  }
}
