import { query } from "@/infrastructure/db";
import { CashClosingWithUser } from "@/domain/entities/CashClosing";
import { CashClosingRepository, UpsertCashClosingInput } from "@/domain/repositories/CashClosingRepository";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

const CLOSING_SELECT = `
  SELECT c.*, u.name AS user_name
  FROM cash_closings c
  JOIN users u ON u.id = c.user_id
`;

export class PgCashClosingRepository implements CashClosingRepository {
  async findByDate(date: string): Promise<CashClosingWithUser | null> {
    const { rows } = await query<CashClosingWithUser>(
      `${CLOSING_SELECT} WHERE c.closing_date = $1::date`,
      [date]
    );
    return rows[0] ?? null;
  }

  async upsert(input: UpsertCashClosingInput, salesCash: string): Promise<CashClosingWithUser> {
    const opening = parseFloat(input.opening_amount || "0");
    const sales = parseFloat(salesCash);
    const counted = parseFloat(input.counted_cash || "0");
    const expectedTotal = (opening + sales).toFixed(2);
    const difference = (counted - (opening + sales)).toFixed(2);

    await query<{ id: number }>(
      `INSERT INTO cash_closings
        (closing_date, user_id, opening_amount, sales_cash, expected_total, counted_cash, difference, notes)
       VALUES ($1::date, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (closing_date) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         opening_amount = EXCLUDED.opening_amount,
         sales_cash = EXCLUDED.sales_cash,
         expected_total = EXCLUDED.expected_total,
         counted_cash = EXCLUDED.counted_cash,
         difference = EXCLUDED.difference,
         notes = EXCLUDED.notes,
         updated_at = now()
       RETURNING id`,
      [
        input.closing_date,
        input.user_id,
        opening.toFixed(2),
        sales.toFixed(2),
        expectedTotal,
        counted.toFixed(2),
        difference,
        input.notes,
      ]
    );

    const closing = await this.findByDate(input.closing_date);
    if (!closing) throw new Error("Erro ao salvar fechamento de caixa.");
    return closing;
  }

  async findPage(page: number, pageSize: number): Promise<PaginatedResult<CashClosingWithUser>> {
    const offset = (page - 1) * pageSize;

    const { rows: countRows } = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM cash_closings`);
    const total = Number(countRows[0]?.count ?? 0);

    const { rows } = await query<CashClosingWithUser>(
      `${CLOSING_SELECT} ORDER BY c.closing_date DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    return buildPaginatedResult(rows, total, page, pageSize);
  }
}
