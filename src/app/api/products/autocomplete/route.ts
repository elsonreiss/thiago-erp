import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";

// Nunca cachear — os preços/estoque precisam refletir a última edição do produto.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const term = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (term.length < 1) return NextResponse.json({ products: [] });

  try {
    const products = await container.productRepository.searchForAutocomplete(term, 15);
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err) {
    console.error("[GET /api/products/autocomplete]", err);
    return NextResponse.json({ error: "Erro ao buscar produtos." }, { status: 500 });
  }
}
