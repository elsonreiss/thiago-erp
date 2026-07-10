import { query, withTransaction } from "@/infrastructure/db";
import { Budget, BudgetStatus, BudgetWithItems, BudgetItem } from "@/domain/entities/Budget";
import {
  CreateBudgetInput,
  BudgetRepository,
} from "@/domain/repositories/BudgetRepository";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

type RawBudgetRow = Budget & { customer_name: string | null; seller_name: string };

const BUDGET_SELECT = `
  SELECT
    b.*,
    c.name AS customer_name,
    u.name AS seller_name
  FROM budgets b
  LEFT JOIN customers c ON c.id = b.customer_id
  JOIN users u ON u.id = b.user_id
`;

async function loadItems(budgetIds: number[]): Promise<Map<number, BudgetItem[]>> {
  if (budgetIds.length === 0) return new Map();
  const { rows } = await query<BudgetItem>(
    `SELECT * FROM budget_items WHERE budget_id = ANY($1::int[]) ORDER BY id ASC`,
    [budgetIds]
  );
  const map = new Map<number, BudgetItem[]>();
  for (const item of rows) {
    const list = map.get(item.budget_id) ?? [];
    list.push(item);
    map.set(item.budget_id, list);
  }
  return map;
}

export class PgBudgetRepository implements BudgetRepository {
  async findById(id: number): Promise<BudgetWithItems | null> {
    const { rows } = await query<RawBudgetRow>(`${BUDGET_SELECT} WHERE b.id = $1`, [id]);
    if (!rows[0]) return null;

    const { rows: items } = await query<BudgetItem>(
      `SELECT * FROM budget_items WHERE budget_id = $1 ORDER BY id ASC`,
      [id]
    );
    return { ...rows[0], items };
  }

  async findAll(status?: BudgetStatus): Promise<BudgetWithItems[]> {
    const where = status ? `WHERE b.status = $1` : "";
    const values = status ? [status] : [];
    const { rows } = await query<RawBudgetRow>(
      `${BUDGET_SELECT} ${where} ORDER BY b.created_at DESC`,
      values
    );
    if (rows.length === 0) return [];

    const itemsByBudget = await loadItems(rows.map((r) => r.id));
    return rows.map((row) => ({ ...row, items: itemsByBudget.get(row.id) ?? [] }));
  }

  async findPage(
    status: BudgetStatus | undefined,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<BudgetWithItems>> {
    const where = status ? `WHERE b.status = $1` : "";
    const values: unknown[] = status ? [status] : [];
    const offset = (page - 1) * pageSize;

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM budgets b ${where}`,
      values
    );
    const total = Number(countRows[0]?.count ?? 0);

    const { rows } = await query<RawBudgetRow>(
      `${BUDGET_SELECT} ${where} ORDER BY b.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, offset]
    );
    if (rows.length === 0) return buildPaginatedResult([], total, page, pageSize);

    const itemsByBudget = await loadItems(rows.map((r) => r.id));
    const items = rows.map((row) => ({ ...row, items: itemsByBudget.get(row.id) ?? [] }));
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(input: CreateBudgetInput): Promise<BudgetWithItems> {
    return withTransaction(async (client) => {
      let subtotalSum = 0;
      const itemRows: Array<{ product_id: number; product_name: string; quantity: number; unit_price: string; subtotal: string }> = [];

      for (const item of input.items) {
        const { rows: productRows } = await client.query(
          `SELECT * FROM products WHERE id = $1`,
          [item.product_id]
        );
        const product = productRows[0];
        if (!product) throw new Error(`Produto ${item.product_id} não encontrado.`);

        const subtotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
        subtotalSum += parseFloat(subtotal);
        itemRows.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal,
        });
        // Nota: orçamento NÃO dá baixa de estoque — só a venda (ou conversão em venda) faz isso.
      }

      const discount = parseFloat(input.discount || "0");
      const total = Math.max(0, subtotalSum - discount).toFixed(2);

      const { rows: budgetRows } = await client.query(
        `INSERT INTO budgets (customer_id, user_id, discount, total, validity_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [input.customer_id, input.user_id, input.discount || "0.00", total, input.validity_date, input.notes]
      );
      const budget = budgetRows[0];

      for (const item of itemRows) {
        await client.query(
          `INSERT INTO budget_items (budget_id, product_id, product_name, quantity, unit_price, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [budget.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
        );
      }

      const { rows: enriched } = await client.query(
        `SELECT b.*, c.name AS customer_name, u.name AS seller_name
         FROM budgets b
         LEFT JOIN customers c ON c.id = b.customer_id
         JOIN users u ON u.id = b.user_id
         WHERE b.id = $1`,
        [budget.id]
      );

      const { rows: items } = await client.query<BudgetItem>(
        `SELECT * FROM budget_items WHERE budget_id = $1 ORDER BY id ASC`,
        [budget.id]
      );

      return { ...enriched[0], items };
    });
  }

  async updateStatus(id: number, status: BudgetStatus): Promise<BudgetWithItems | null> {
    await query(`UPDATE budgets SET status = $1 WHERE id = $2`, [status, id]);
    return this.findById(id);
  }

  async markConverted(id: number, saleId: number): Promise<void> {
    await query(
      `UPDATE budgets SET status = 'convertido', converted_sale_id = $1 WHERE id = $2`,
      [saleId, id]
    );
  }

  async delete(id: number): Promise<void> {
    await query(`DELETE FROM budgets WHERE id = $1`, [id]);
  }

  async countApproved(from: string, to: string): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM budgets WHERE status = 'aprovado' AND created_at >= $1 AND created_at <= $2`,
      [from, to]
    );
    return Number(rows[0]?.count ?? 0);
  }
}
