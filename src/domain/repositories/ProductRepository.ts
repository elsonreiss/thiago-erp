import { Product } from "@/domain/entities/Product";

export interface CreateProductInput {
  code: string;
  barcode: string | null;
  name: string;
  category: string;
  brand: string | null;
  unit: string;
  description: string | null;
  photo: string | null;
  purchase_price: string;
  sale_price: string;
  min_stock: number;
  quantity: number;
  location: string | null;
  supplier_id: number | null;
}

export type UpdateProductInput = Partial<CreateProductInput> & { active?: boolean };

export interface ProductFilters {
  search?: string;
  category?: string;
  stockStatus?: "em_falta" | "estoque_baixo" | "ok";
  activeOnly?: boolean;
}

export interface ProductRepository {
  findById(id: number): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  findAll(filters?: ProductFilters): Promise<Product[]>;
  searchForAutocomplete(query: string, limit?: number): Promise<Product[]>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: number, input: UpdateProductInput): Promise<Product | null>;
  delete(id: number): Promise<void>;
  adjustQuantity(id: number, delta: number): Promise<void>;
  countTotal(): Promise<number>;
  countOutOfStock(): Promise<number>;
  countLowStock(): Promise<number>;
  mostSold(limit: number, since?: string): Promise<Array<{ product: Product; total_quantity: number }>>;
  stagnant(daysSinceLastMovement: number): Promise<Product[]>;
}
