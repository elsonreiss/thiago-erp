import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { GetProduct } from "@/application/use-cases/products/GetProduct";
import { UpdateProduct, ProductNotFoundError } from "@/application/use-cases/products/UpdateProduct";
import { DeleteProduct } from "@/application/use-cases/products/DeleteProduct";
import { DuplicateProductCodeError, ProductValidationError } from "@/application/use-cases/products/CreateProduct";
import { UpdateProductInput } from "@/domain/repositories/ProductRepository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new GetProduct(container.productRepository);
  const product = await useCase.execute(Number(id));
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  let body: UpdateProductInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (body.min_stock !== undefined) body.min_stock = Number(body.min_stock);
  if (body.quantity !== undefined) body.quantity = Number(body.quantity);

  const useCase = new UpdateProduct(container.productRepository);
  try {
    const product = await useCase.execute(Number(id), body);
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ProductValidationError || err instanceof DuplicateProductCodeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[PUT /api/products/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar produto." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const useCase = new DeleteProduct(container.productRepository);
  try {
    await useCase.execute(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/products/[id]]", err);
    return NextResponse.json({ error: "Erro ao excluir produto." }, { status: 500 });
  }
}
