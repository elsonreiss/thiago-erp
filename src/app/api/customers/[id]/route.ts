import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { UpdateCustomer, CustomerNotFoundError } from "@/application/use-cases/customers/UpdateCustomer";
import { DeleteCustomer } from "@/application/use-cases/customers/DeleteCustomer";
import { CustomerValidationError } from "@/application/use-cases/customers/CreateCustomer";
import { UpdateCustomerInput } from "@/domain/repositories/CustomerRepository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const customer = await container.customerRepository.findById(Number(id));
  if (!customer) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  let body: UpdateCustomerInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const useCase = new UpdateCustomer(container.customerRepository);
  try {
    const customer = await useCase.execute(Number(id), body);
    return NextResponse.json({ customer });
  } catch (err) {
    if (err instanceof CustomerNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof CustomerValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[PUT /api/customers/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar cliente." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new DeleteCustomer(container.customerRepository);
  try {
    await useCase.execute(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/customers/[id]]", err);
    return NextResponse.json({ error: "Erro ao excluir cliente." }, { status: 500 });
  }
}
