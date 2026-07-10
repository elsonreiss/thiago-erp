import { BudgetStatus, BudgetWithItems } from "@/domain/entities/Budget";
import { PaginatedResult } from "@/lib/pagination";

export interface CreateBudgetItemInput {
  product_id: number;
  quantity: number;
  unit_price: string;
}

export interface CreateBudgetInput {
  customer_id: number | null;
  user_id: number;
  discount: string;
  validity_date: string | null;
  notes: string | null;
  items: CreateBudgetItemInput[];
}

export interface BudgetRepository {
  findById(id: number): Promise<BudgetWithItems | null>;
  findAll(status?: BudgetStatus): Promise<BudgetWithItems[]>;
  findPage(status: BudgetStatus | undefined, page: number, pageSize: number): Promise<PaginatedResult<BudgetWithItems>>;
  create(input: CreateBudgetInput): Promise<BudgetWithItems>;
  updateStatus(id: number, status: BudgetStatus): Promise<BudgetWithItems | null>;
  markConverted(id: number, saleId: number): Promise<void>;
  delete(id: number): Promise<void>;
  countApproved(from: string, to: string): Promise<number>;
}
