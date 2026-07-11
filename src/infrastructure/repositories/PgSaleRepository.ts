import { PoolClient } from "pg";
import { query, withTransaction } from "@/infrastructure/db";
import { Sale, SaleWithItems, SaleItem, PaymentMethod } from "@/domain/entities/Sale";
import {
  CreateSaleInput,
  SaleFilters,
  SaleRepository,
} from "@/domain/repositories/SaleRepository";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

function buildSaleWhere(filters: SaleFilters): { where: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (filters.from) {
    conditions.push(`s.created_at >= $${i}`);
    values.push(filters.from);
    i++;
  }
  if (filters.to) {
    conditions.push(`s.created_at <= $${i}`);
    values.push(filters.to);
    i++;
  }
  if (filters.userId) {
    conditions.push(`s.user_id = $${i}`);
    values.push(filters.userId);
    i++;
  }
  if (filters.customerId) {
    conditions.push(`s.customer_id = $${i}`);
    values.push(filters.customerId);
    i++;
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", values };
}

type RawSaleRow = Sale & { customer_name: string | null; seller_name: string };

const SALE_SELECT = `
  SELECT
    s.*,
    c.name AS customer_name,
    u.name AS seller_name
  FROM sales s
  LEFT JOIN customers c ON c.id = s.customer_id
  JOIN users u ON u.id = s.user_id
`;

async function attachItems(client: PoolClient, sale: RawSaleRow): Promise<SaleWithItems> {
  const { rows: items } = await client.query<SaleItem>(
    `SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id ASC`,
    [sale.id]
  );
  return { ...sale, items };
}

export class PgSaleRepository implements SaleRepository {
  async findById(id: number): Promise<SaleWithItems | null> {
    const { rows } = await query<RawSaleRow>(`${SALE_SELECT} WHERE s.id = $1`, [id]);
    if (!rows[0]) return null;

    const { rows: items } = await query<SaleItem>(
      `SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id ASC`,
      [id]
    );
    return { ...rows[0], items };
  }

  async updateNfceNumber(id: number, nfceNumber: string | null): Promise<SaleWithItems | null> {
    await query(`UPDATE sales SET nfce_number = $1 WHERE id = $2`, [nfceNumber, id]);
    return this.findById(id);
  }

  async findAll(filters: SaleFilters = {}): Promise<SaleWithItems[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (filters.from) {
      conditions.push(`s.created_at >= $${i}`);
      values.push(filters.from);
      i++;
    }
    if (filters.to) {
      conditions.push(`s.created_at <= $${i}`);
      values.push(filters.to);
      i++;
    }
    if (filters.userId) {
      conditions.push(`s.user_id = $${i}`);
      values.push(filters.userId);
      i++;
    }
    if (filters.customerId) {
      conditions.push(`s.customer_id = $${i}`);
      values.push(filters.customerId);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query<RawSaleRow>(`${SALE_SELECT} ${where} ORDER BY s.created_at DESC`, values);

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const { rows: allItems } = await query<SaleItem>(
      `SELECT * FROM sale_items WHERE sale_id = ANY($1::int[]) ORDER BY id ASC`,
      [ids]
    );
    const itemsBySale = new Map<number, SaleItem[]>();
    for (const item of allItems) {
      const list = itemsBySale.get(item.sale_id) ?? [];
      list.push(item);
      itemsBySale.set(item.sale_id, list);
    }

    return rows.map((row) => ({ ...row, items: itemsBySale.get(row.id) ?? [] }));
  }

  async findPage(filters: SaleFilters, page: number, pageSize: number): Promise<PaginatedResult<SaleWithItems>> {
    const { where, values } = buildSaleWhere(filters);
    const offset = (page - 1) * pageSize;

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM sales s ${where}`,
      values
    );
    const total = Number(countRows[0]?.count ?? 0);

    const { rows } = await query<RawSaleRow>(
      `${SALE_SELECT} ${where} ORDER BY s.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, offset]
    );
    if (rows.length === 0) return buildPaginatedResult([], total, page, pageSize);

    const ids = rows.map((r) => r.id);
    const { rows: allItems } = await query<SaleItem>(
      `SELECT * FROM sale_items WHERE sale_id = ANY($1::int[]) ORDER BY id ASC`,
      [ids]
    );
    const itemsBySale = new Map<number, SaleItem[]>();
    for (const item of allItems) {
      const list = itemsBySale.get(item.sale_id) ?? [];
      list.push(item);
      itemsBySale.set(item.sale_id, list);
    }

    const items = rows.map((row) => ({ ...row, items: itemsBySale.get(row.id) ?? [] }));
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(input: CreateSaleInput): Promise<SaleWithItems> {
    return withTransaction(async (client) => {
      let subtotalSum = 0;
      const itemRows: Array<{ product_id: number | null; product_name: string; quantity: number; unit_price: string; subtotal: string }> = [];

      for (const item of input.items) {
        let productName: string;

        if (item.product_id) {
          const { rows: productRows } = await client.query(
            `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
            [item.product_id]
          );
          const product = productRows[0];
          if (!product) throw new Error(`Produto ${item.product_id} não encontrado.`);
          if (!input.skipStockDecrement && product.quantity < item.quantity) {
            throw new Error(`Estoque insuficiente para "${product.name}" (disponível: ${product.quantity}).`);
          }
          productName = product.name;

          // Nota de cliente (fiado) já baixou o estoque no momento em que foi registrada;
          // ao quitá-la e virar venda de verdade, não baixamos de novo.
          if (!input.skipStockDecrement) {
            await client.query(
              `UPDATE products SET quantity = quantity - $1, updated_at = now() WHERE id = $2`,
              [item.quantity, item.product_id]
            );
          }
        } else {
          // Item avulso: digitado na hora, sem produto cadastrado — não mexe em estoque.
          productName = item.product_name?.trim() || "Item avulso";
        }

        const subtotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
        subtotalSum += parseFloat(subtotal);
        itemRows.push({
          product_id: item.product_id ?? null,
          product_name: productName,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal,
        });
      }

      const discount = parseFloat(input.discount || "0");
      const total = Math.max(0, subtotalSum - discount).toFixed(2);

      const { rows: saleRows } = await client.query(
        `INSERT INTO sales (customer_id, user_id, payment_method, discount, total, notes)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [input.customer_id, input.user_id, input.payment_method, input.discount || "0.00", total, input.notes]
      );
      const sale = saleRows[0];

      for (const item of itemRows) {
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [sale.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
        );
      }

      const { rows: enriched } = await client.query(
        `SELECT s.*, c.name AS customer_name, u.name AS seller_name
         FROM sales s
         LEFT JOIN customers c ON c.id = s.customer_id
         JOIN users u ON u.id = s.user_id
         WHERE s.id = $1`,
        [sale.id]
      );

      return attachItems(client, enriched[0]);
    });
  }

  async recent(limit: number): Promise<SaleWithItems[]> {
    return this.findAll({}).then((sales) => sales.slice(0, limit));
  }

  async totalRevenue(from: string, to: string, userId?: number): Promise<number> {
    const values: unknown[] = [from, to];
    let userClause = "";
    if (userId) {
      values.push(userId);
      userClause = `AND user_id = $3`;
    }
    const { rows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(total), 0)::text AS total FROM sales WHERE created_at >= $1 AND created_at <= $2 ${userClause}`,
      values
    );
    return Number(rows[0]?.total ?? 0);
  }

  async countSalesToday(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM sales WHERE created_at::date = CURRENT_DATE`
    );
    return Number(rows[0]?.count ?? 0);
  }

  async revenueByDay(from: string, to: string): Promise<Array<{ day: string; total: number }>> {
    const { rows } = await query<{ day: string; total: string }>(
      `SELECT created_at::date::text AS day, COALESCE(SUM(total), 0)::text AS total
       FROM sales
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY created_at::date
       ORDER BY created_at::date ASC`,
      [from, to]
    );
    return rows.map((r) => ({ day: r.day, total: Number(r.total) }));
  }

  async revenueBySeller(
    from: string,
    to: string
  ): Promise<Array<{ user_id: number; seller_name: string; total: number; count: number }>> {
    const { rows } = await query<{ user_id: number; seller_name: string; total: string; count: string }>(
      `SELECT u.id AS user_id, u.name AS seller_name, COALESCE(SUM(s.total), 0)::text AS total, COUNT(s.id)::text AS count
       FROM users u
       LEFT JOIN sales s ON s.user_id = u.id AND s.created_at >= $1 AND s.created_at <= $2
       GROUP BY u.id, u.name
       HAVING COUNT(s.id) > 0
       ORDER BY SUM(s.total) DESC NULLS LAST`,
      [from, to]
    );
    return rows.map((r) => ({
      user_id: r.user_id,
      seller_name: r.seller_name,
      total: Number(r.total),
      count: Number(r.count),
    }));
  }

  async revenueByMonth(from: string, to: string): Promise<Array<{ month: string; total: number }>> {
    const { rows } = await query<{ month: string; total: string }>(
      `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COALESCE(SUM(total), 0)::text AS total
       FROM sales
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY date_trunc('month', created_at)
       ORDER BY date_trunc('month', created_at) ASC`,
      [from, to]
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  }

  async revenueByPaymentMethodForDay(
    date: string
  ): Promise<Array<{ payment_method: PaymentMethod; total: number; count: number }>> {
    const { rows } = await query<{ payment_method: PaymentMethod; total: string; count: string }>(
      `SELECT payment_method, COALESCE(SUM(total), 0)::text AS total, COUNT(*)::text AS count
       FROM sales
       WHERE created_at::date = $1::date
       GROUP BY payment_method
       ORDER BY payment_method ASC`,
      [date]
    );
    return rows.map((r) => ({
      payment_method: r.payment_method,
      total: Number(r.total),
      count: Number(r.count),
    }));
  }

  async delete(id: number): Promise<void> {
    await withTransaction(async (client) => {
      const { rows: items } = await client.query<{ product_id: number | null; quantity: number }>(
        `SELECT product_id, quantity FROM sale_items WHERE sale_id = $1`,
        [id]
      );

      // Devolve ao estoque a quantidade que tinha sido baixada por essa venda
      // (produtos excluídos depois da venda deixam product_id nulo — nada a devolver).
      for (const item of items) {
        if (item.product_id === null) continue;
        await client.query(
          `UPDATE products SET quantity = quantity + $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      await client.query(`DELETE FROM sales WHERE id = $1`, [id]);
    });
  }
}
