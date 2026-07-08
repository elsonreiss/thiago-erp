import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { canViewFinancials } from "@/domain/entities/User";

/** Lista de usuários (vendedores) pra filtro — só quem pode ver financeiro pode listar todos. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canViewFinancials(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const users = await container.userRepository.findAll();
  const sellers = users
    .filter((u) => u.active)
    .map((u) => ({ id: u.id, name: u.name, role: u.role }));

  return NextResponse.json({ sellers });
}
