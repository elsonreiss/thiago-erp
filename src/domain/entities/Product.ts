export const DEFAULT_PRODUCT_CATEGORIES = [
  "Cimento",
  "Tijolos",
  "Areia",
  "Pedra",
  "Ferro",
  "Tubos",
  "Hidráulica",
  "Elétrica",
  "Ferramentas",
  "Tintas",
  "Pisos",
  "Cerâmicas",
  "Telhas",
  "Madeira",
  "Parafusos",
  "Ferragens",
  "Outros",
] as const;

export const PRODUCT_UNITS = ["UN", "PC", "CX", "KG", "M", "M2", "M3", "L", "SC", "PAR", "ROLO"] as const;

export type ProductStockStatus = "em_falta" | "estoque_baixo" | "ok";

export interface Product {
  id: number;
  code: string;
  barcode: string | null;
  name: string;
  category: string;
  brand: string | null;
  unit: string;
  description: string | null;
  photo: string | null; // base64 data URL
  purchase_price: string; // numeric como string
  sale_price: string;
  min_stock: number;
  quantity: number;
  location: string | null;
  supplier_id: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function getStockStatus(product: Pick<Product, "quantity" | "min_stock">): ProductStockStatus {
  if (product.quantity <= 0) return "em_falta";
  if (product.quantity <= product.min_stock) return "estoque_baixo";
  return "ok";
}
