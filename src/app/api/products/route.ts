import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { ListProducts } from "@/application/use-cases/products/ListProducts";
import { CreateProduct, ProductValidationError, DuplicateProductCodeError } from "@/application/use-cases/products/CreateProduct";
import { ProductStockStatus } from "@/domain/entities/Product";
import { CreateProductInput } from "@/domain/repositories/ProductRepository";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const search = params.get("search") ?? undefined;
  const category = params.get("category") ?? undefined;
  const stockStatus = (params.get("stockStatus") as ProductStockStatus | null) ?? undefined;
  const activeOnly = params.get("activeOnly") === "false" ? false : true;

  const useCase = new ListProducts(container.productRepository);
  const products = await useCase.execute({ search, category, stockStatus, activeOnly });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: Partial<CreateProductInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const input: CreateProductInput = {
    code: body.code ?? "",
    barcode: body.barcode ?? null,
    name: body.name ?? "",
    category: body.category ?? "Outros",
    brand: body.brand ?? null,
    unit: body.unit ?? "UN",
    description: body.description ?? null,
    photo: body.photo ?? null,
    purchase_price: body.purchase_price ?? "0.00",
    sale_price: body.sale_price ?? "0.00",
    min_stock: Number(body.min_stock ?? 0),
    quantity: Number(body.quantity ?? 0),
    location: body.location ?? null,
    supplier_id: body.supplier_id ?? null,
  };

  const useCase = new CreateProduct(container.productRepository);
  try {
    const product = await useCase.execute(input);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof ProductValidationError || err instanceof DuplicateProductCodeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/products]", err);
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 500 });
  }
}
