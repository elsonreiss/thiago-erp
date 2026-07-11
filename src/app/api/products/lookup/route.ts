import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";

// Sempre busca o preço/estoque mais recente do banco — nunca cachear (ver bug do
// leitor de código de barras mostrando preço desatualizado após edição do produto).
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Busca exata de produto por código interno ou código de barras — usado pelo leitor de código de barras. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const value = request.nextUrl.searchParams.get("code")?.trim();
  if (!value) return NextResponse.json({ error: "Código é obrigatório." }, { status: 400 });

  const product = await container.productRepository.findByCodeOrBarcode(value);
  if (!product) {
    return NextResponse.json(
      { error: "Produto não encontrado para esse código." },
      { status: 404, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  return NextResponse.json(
    { product },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
