import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { CreateSupplier, SupplierValidationError } from "@/application/use-cases/suppliers/CreateSupplier";
import { CreateSupplierInput } from "@/domain/repositories/SupplierRepository";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  const suppliers = await container.supplierRepository.findAll(search);
  return NextResponse.json({ suppliers });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: Partial<CreateSupplierInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateSupplierInput = {
    name: body.name ?? "",
    cnpj: body.cnpj ?? null,
    contact_name: body.contact_name ?? null,
    phone: body.phone ?? null,
    whatsapp: body.whatsapp ?? null,
    email: body.email ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    notes: body.notes ?? null,
  };

  const useCase = new CreateSupplier(container.supplierRepository);
  try {
    const supplier = await useCase.execute(input);
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (err) {
    if (err instanceof SupplierValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/suppliers]", err);
    return NextResponse.json({ error: "Erro ao criar fornecedor." }, { status: 500 });
  }
}
