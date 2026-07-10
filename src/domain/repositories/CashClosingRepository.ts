import { CashClosingWithUser } from "@/domain/entities/CashClosing";
import { PaginatedResult } from "@/lib/pagination";

export interface UpsertCashClosingInput {
  closing_date: string; // "YYYY-MM-DD"
  user_id: number;
  opening_amount: string;
  counted_cash: string;
  notes: string | null;
}

export interface CashClosingRepository {
  findByDate(date: string): Promise<CashClosingWithUser | null>;
  /** Cria ou atualiza o fechamento daquele dia (um fechamento por data). */
  upsert(input: UpsertCashClosingInput, salesCash: string): Promise<CashClosingWithUser>;
  findPage(page: number, pageSize: number): Promise<PaginatedResult<CashClosingWithUser>>;
}
