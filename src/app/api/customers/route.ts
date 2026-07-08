import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { CreateCustomer, CustomerValidationError } from "@/application/use-cases/customers/CreateCustomer";
import { CreateCustomerInput } from "@/domain/repositories/CustomerRepository";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  const customers = await container.customerRepository.findAll(search);
  return NextResponse.json({ customers });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: Partial<CreateCustomerInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateCustomerInput = {
    name: body.name ?? "",
    document: body.document ?? null,
    phone: body.phone ?? null,
    whatsapp: body.whatsapp ?? null,
    email: body.email ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    notes: body.notes ?? null,
  };

  const useCase = new CreateCustomer(container.customerRepository);
  try {
    const customer = await useCase.execute(input);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    if (err instanceof CustomerValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/customers]", err);
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 500 });
  }
}
