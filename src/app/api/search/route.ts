import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results: Array<{ type: string; id: number; title: string; subtitle: string; href: string }> = [];

  const products = await container.productRepository.searchForAutocomplete(q, 5);
  for (const p of products) {
    results.push({
      type: "produto",
      id: p.id,
      title: p.name,
      subtitle: `${p.code} · ${p.category} · estoque: ${p.quantity}`,
      href: `/estoque/${p.id}`,
    });
  }

  if (container.customerRepository) {
    const customers = await container.customerRepository.searchForAutocomplete(q, 5);
    for (const c of customers) {
      results.push({
        type: "cliente",
        id: c.id,
        title: c.name,
        subtitle: c.phone || c.email || c.city || "",
        href: `/clientes/${c.id}`,
      });
    }
  }

  if (container.supplierRepository) {
    const suppliers = await container.supplierRepository.searchForAutocomplete(q, 5);
    for (const s of suppliers) {
      results.push({
        type: "fornecedor",
        id: s.id,
        title: s.name,
        subtitle: s.phone || s.email || s.city || "",
        href: `/fornecedores/${s.id}`,
      });
    }
  }

  return NextResponse.json({ results });
}
