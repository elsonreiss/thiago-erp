import { PurchaseWithItems } from "@/domain/entities/Purchase";

export interface CreatePurchaseItemInput {
  product_id: number;
  quantity: number;
  unit_price: string;
}

export interface CreatePurchaseInput {
  supplier_id: number | null;
  user_id: number;
  notes: string | null;
  items: CreatePurchaseItemInput[];
}

export interface PurchaseRepository {
  findById(id: number): Promise<PurchaseWithItems | null>;
  findAll(): Promise<PurchaseWithItems[]>;
  create(input: CreatePurchaseInput): Promise<PurchaseWithItems>;
  totalSpent(from: string, to: string): Promise<number>;
}
