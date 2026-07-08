import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import {
  CreateProduct,
  ProductValidationError,
  DuplicateProductCodeError,
} from "@/application/use-cases/products/CreateProduct";
import { CreateProductInput } from "@/domain/repositories/ProductRepository";

interface BulkImportRow extends Partial<CreateProductInput> {
  code?: string;
  name?: string;
}

interface RowResult {
  index: number;
  code: string;
  name: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: { products?: BulkImportRow[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const rows = body.products ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Nenhum produto para importar." }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Máximo de 500 produtos por importação." }, { status: 400 });
  }

  const useCase = new CreateProduct(container.productRepository);
  const results: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const input: CreateProductInput = {
      code: row.code ?? "",
      barcode: row.barcode ?? null,
      name: row.name ?? "",
      category: row.category ?? "Outros",
      brand: row.brand ?? null,
      unit: row.unit ?? "UN",
      description: null,
      photo: null,
      purchase_price: row.purchase_price ?? "0.00",
      sale_price: row.sale_price ?? "0.00",
      min_stock: Number(row.min_stock ?? 0),
      quantity: Number(row.quantity ?? 0),
      location: row.location ?? null,
      supplier_id: row.supplier_id ?? null,
    };

    try {
      await useCase.execute(input);
      results.push({ index: i, code: input.code, name: input.name, success: true });
    } catch (err) {
      let message = "Erro ao cadastrar produto.";
      if (err instanceof ProductValidationError || err instanceof DuplicateProductCodeError) {
        message = err.message;
      } else {
        console.error("[POST /api/products/bulk-import] row", i, err);
      }
      results.push({ index: i, code: input.code, name: input.name, success: false, error: message });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  return NextResponse.json({ results, successCount, total: results.length });
}
