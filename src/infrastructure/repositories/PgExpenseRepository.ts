import { query } from "@/infrastructure/db";
import { Expense } from "@/domain/entities/Expense";
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseRepository,
} from "@/domain/repositories/ExpenseRepository";

export class PgExpenseRepository implements ExpenseRepository {
  async findById(id: number): Promise<Expense | null> {
    const { rows } = await query<Expense>("SELECT * FROM expenses WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  async findAll(from?: string, to?: string): Promise<Expense[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (from) {
      conditions.push(`expense_date >= $${i}`);
      values.push(from);
      i++;
    }
    if (to) {
      conditions.push(`expense_date <= $${i}`);
      values.push(to);
      i++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await query<Expense>(
      `SELECT * FROM expenses ${where} ORDER BY expense_date DESC, id DESC`,
      values
    );
    return rows;
  }

  async create(input: CreateExpenseInput): Promise<Expense> {
    const { rows } = await query<Expense>(
      `INSERT INTO expenses (description, category, amount, expense_date, notes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [input.description, input.category, input.amount, input.expense_date, input.notes]
    );
    return rows[0];
  }

  async update(id: number, input: UpdateExpenseInput): Promise<Expense | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      fields.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await query<Expense>(
      `UPDATE expenses SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<void> {
    await query(`DELETE FROM expenses WHERE id = $1`, [id]);
  }

  async totalByCategory(from: string, to: string): Promise<Array<{ category: string; total: number }>> {
    const { rows } = await query<{ category: string; total: string }>(
      `SELECT category, COALESCE(SUM(amount), 0)::text AS total
       FROM expenses
       WHERE expense_date >= $1 AND expense_date <= $2
       GROUP BY category
       ORDER BY SUM(amount) DESC`,
      [from, to]
    );
    return rows.map((r) => ({ category: r.category, total: Number(r.total) }));
  }

  async totalInRange(from: string, to: string): Promise<number> {
    const { rows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS total FROM expenses WHERE expense_date >= $1 AND expense_date <= $2`,
      [from, to]
    );
    return Number(rows[0]?.total ?? 0);
  }
}
