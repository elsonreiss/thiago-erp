import { Expense } from "@/domain/entities/Expense";

export type CreateExpenseInput = Omit<Expense, "id" | "created_at">;
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface ExpenseRepository {
  findById(id: number): Promise<Expense | null>;
  findAll(from?: string, to?: string): Promise<Expense[]>;
  create(input: CreateExpenseInput): Promise<Expense>;
  update(id: number, input: UpdateExpenseInput): Promise<Expense | null>;
  delete(id: number): Promise<void>;
  totalByCategory(from: string, to: string): Promise<Array<{ category: string; total: number }>>;
  totalInRange(from: string, to: string): Promise<number>;
}
