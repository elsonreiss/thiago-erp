import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { UpdateSupplier, SupplierNotFoundError } from "@/application/use-cases/suppliers/UpdateSupplier";
import { DeleteSupplier } from "@/application/use-cases/suppliers/DeleteSupplier";
import { SupplierValidationError } from "@/application/use-cases/suppliers/CreateSupplier";
import { UpdateSupplierInput } from "@/domain/repositories/SupplierRepository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const supplier = await container.supplierRepository.findById(Number(id));
  if (!supplier) return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
  return NextResponse.json({ supplier });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  let body: UpdateSupplierInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const useCase = new UpdateSupplier(container.supplierRepository);
  try {
    const supplier = await useCase.execute(Number(id), body);
    return NextResponse.json({ supplier });
  } catch (err) {
    if (err instanceof SupplierNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof SupplierValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[PUT /api/suppliers/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar fornecedor." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new DeleteSupplier(container.supplierRepository);
  try {
    await useCase.execute(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/suppliers/[id]]", err);
    return NextResponse.json({ error: "Erro ao excluir fornecedor." }, { status: 500 });
  }
}
