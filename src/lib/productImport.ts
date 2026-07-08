import { DEFAULT_PRODUCT_CATEGORIES, PRODUCT_UNITS } from "@/domain/entities/Product";

/** Campos de produto que podem ser preenchidos a partir de uma planilha. */
export type ImportableField =
  | "code"
  | "name"
  | "category"
  | "brand"
  | "unit"
  | "barcode"
  | "purchase_price"
  | "sale_price"
  | "min_stock"
  | "quantity"
  | "location";

export const IMPORT_FIELDS: Array<{ field: ImportableField; label: string; required?: boolean }> = [
  { field: "code", label: "Código", required: true },
  { field: "name", label: "Nome", required: true },
  { field: "category", label: "Categoria" },
  { field: "brand", label: "Marca" },
  { field: "unit", label: "Unidade" },
  { field: "barcode", label: "Código de barras" },
  { field: "purchase_price", label: "Preço de compra" },
  { field: "sale_price", label: "Preço de venda" },
  { field: "min_stock", label: "Estoque mínimo" },
  { field: "quantity", label: "Quantidade" },
  { field: "location", label: "Localização" },
];

/** Nomes de coluna reconhecidos automaticamente (já normalizados: minúsculo, sem acento). */
const HEADER_ALIASES: Record<ImportableField, string[]> = {
  code: ["codigo", "código", "code", "sku", "cod", "ref", "referencia"],
  name: ["nome", "produto", "descricao", "description", "name", "item"],
  category: ["categoria", "category", "grupo", "familia"],
  brand: ["marca", "brand", "fabricante"],
  unit: ["unidade", "un", "unit", "medida"],
  barcode: ["codigo de barras", "codigobarras", "ean", "barcode", "gtin"],
  purchase_price: ["preco de compra", "precocompra", "custo", "preco custo", "purchase price", "valor compra"],
  sale_price: ["preco de venda", "precovenda", "preco", "venda", "sale price", "valor venda", "preco venda"],
  min_stock: ["estoque minimo", "estoqueminimo", "min stock", "minimo"],
  quantity: ["quantidade", "qtd", "qtde", "quantity", "estoque", "saldo"],
  location: ["localizacao", "local", "location", "corredor", "prateleira"],
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Tenta adivinhar, pra cada campo, qual coluna (índice) da planilha corresponde. */
export function guessColumnMapping(headers: string[]): Partial<Record<ImportableField, number>> {
  const normalizedHeaders = headers.map(normalize);
  const mapping: Partial<Record<ImportableField, number>> = {};

  for (const field of Object.keys(HEADER_ALIASES) as ImportableField[]) {
    const aliases = HEADER_ALIASES[field];
    const idx = normalizedHeaders.findIndex((h) => aliases.includes(h));
    if (idx !== -1) mapping[field] = idx;
  }

  return mapping;
}

function normalizeCategory(value: string | undefined): string {
  if (!value) return "Outros";
  const norm = normalize(value);
  const match = DEFAULT_PRODUCT_CATEGORIES.find((c) => normalize(c) === norm);
  return match ?? "Outros";
}

function normalizeUnit(value: string | undefined): string {
  if (!value) return "UN";
  const upper = value.trim().toUpperCase();
  const match = PRODUCT_UNITS.find((u) => u === upper);
  return match ?? "UN";
}

function parseMoney(value: string | undefined): string {
  if (!value) return "0.00";
  const normalized = String(value).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

function parseInt0(value: string | undefined): number {
  if (!value) return 0;
  const num = parseInt(String(value).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(num) ? num : 0;
}

export interface DraftProduct {
  code: string;
  name: string;
  category: string;
  brand: string | null;
  unit: string;
  barcode: string | null;
  purchase_price: string;
  sale_price: string;
  min_stock: number;
  quantity: number;
  location: string | null;
}

/** Converte as linhas cruas da planilha (com base no mapeamento de colunas) em rascunhos de produto prontos pra revisão. */
export function buildDraftProducts(
  rows: string[][],
  mapping: Partial<Record<ImportableField, number>>
): DraftProduct[] {
  function cell(row: string[], field: ImportableField): string | undefined {
    const idx = mapping[field];
    if (idx === undefined) return undefined;
    const value = row[idx];
    return value === undefined || value === null ? undefined : String(value).trim();
  }

  return rows
    .map((row) => ({
      code: cell(row, "code") ?? "",
      name: cell(row, "name") ?? "",
      category: normalizeCategory(cell(row, "category")),
      brand: cell(row, "brand") || null,
      unit: normalizeUnit(cell(row, "unit")),
      barcode: cell(row, "barcode") || null,
      purchase_price: parseMoney(cell(row, "purchase_price")),
      sale_price: parseMoney(cell(row, "sale_price")),
      min_stock: parseInt0(cell(row, "min_stock")),
      quantity: parseInt0(cell(row, "quantity")),
      location: cell(row, "location") || null,
    }))
    .filter((draft) => draft.code || draft.name);
}
