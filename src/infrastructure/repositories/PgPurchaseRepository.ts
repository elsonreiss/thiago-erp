import { PoolClient } from "pg";
import { query, withTransaction } from "@/infrastructure/db";
import { Purchase, PurchaseWithItems, PurchaseItem } from "@/domain/entities/Purchase";
import {
  CreatePurchaseInput,
  PurchaseRepository,
} from "@/domain/repositories/PurchaseRepository";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

type RawPurchaseRow = Purchase & { supplier_name: string | null };

const PURCHASE_SELECT = `
  SELECT
    p.*,
    s.name AS supplier_name
  FROM purchases p
  LEFT JOIN suppliers s ON s.id = p.supplier_id
`;

async function attachItems(client: PoolClient, purchase: RawPurchaseRow): Promise<PurchaseWithItems> {
  const { rows: items } = await client.query<PurchaseItem>(
    `SELECT * FROM purchase_items WHERE purchase_id = $1 ORDER BY id ASC`,
    [purchase.id]
  );
  return { ...purchase, items };
}

export class PgPurchaseRepository implements PurchaseRepository {
  async findById(id: number): Promise<PurchaseWithItems | null> {
    const { rows } = await query<RawPurchaseRow>(`${PURCHASE_SELECT} WHERE p.id = $1`, [id]);
    if (!rows[0]) return null;

    const { rows: items } = await query<PurchaseItem>(
      `SELECT * FROM purchase_items WHERE purchase_id = $1 ORDER BY id ASC`,
      [id]
    );
    return { ...rows[0], items };
  }

  async findAll(): Promise<PurchaseWithItems[]> {
    const { rows } = await query<RawPurchaseRow>(`${PURCHASE_SELECT} ORDER BY p.created_at DESC`);
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const { rows: allItems } = await query<PurchaseItem>(
      `SELECT * FROM purchase_items WHERE purchase_id = ANY($1::int[]) ORDER BY id ASC`,
      [ids]
    );
    const itemsByPurchase = new Map<number, PurchaseItem[]>();
    for (const item of allItems) {
      const list = itemsByPurchase.get(item.purchase_id) ?? [];
      list.push(item);
      itemsByPurchase.set(item.purchase_id, list);
    }

    return rows.map((row) => ({ ...row, items: itemsByPurchase.get(row.id) ?? [] }));
  }

  async findPage(page: number, pageSize: number): Promise<PaginatedResult<PurchaseWithItems>> {
    const offset = (page - 1) * pageSize;

    const { rows: countRows } = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM purchases`);
    const total = Number(countRows[0]?.count ?? 0);

    const { rows } = await query<RawPurchaseRow>(
      `${PURCHASE_SELECT} ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );
    if (rows.length === 0) return buildPaginatedResult([], total, page, pageSize);

    const ids = rows.map((r) => r.id);
    const { rows: allItems } = await query<PurchaseItem>(
      `SELECT * FROM purchase_items WHERE purchase_id = ANY($1::int[]) ORDER BY id ASC`,
      [ids]
    );
    const itemsByPurchase = new Map<number, PurchaseItem[]>();
    for (const item of allItems) {
      const list = itemsByPurchase.get(item.purchase_id) ?? [];
      list.push(item);
      itemsByPurchase.set(item.purchase_id, list);
    }

    const items = rows.map((row) => ({ ...row, items: itemsByPurchase.get(row.id) ?? [] }));
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async create(input: CreatePurchaseInput): Promise<PurchaseWithItems> {
    return withTransaction(async (client) => {
      let total = 0;
      const itemRows: Array<{ product_id: number; product_name: string; quantity: number; unit_price: string; subtotal: string }> = [];

      for (const item of input.items) {
        const { rows: productRows } = await client.query(
          `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
          [item.product_id]
        );
        const product = productRows[0];
        if (!product) throw new Error(`Produto ${item.product_id} não encontrado.`);

        const subtotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
        total += parseFloat(subtotal);
        itemRows.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal,
        });

        await client.query(
          `UPDATE products SET quantity = quantity + $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      const { rows: purchaseRows } = await client.query(
        `INSERT INTO purchases (supplier_id, user_id, total, notes)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [input.supplier_id, input.user_id, total.toFixed(2), input.notes]
      );
      const purchase = purchaseRows[0];

      for (const item of itemRows) {
        await client.query(
          `INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit_price, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [purchase.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
        );
      }

      const { rows: enriched } = await client.query(
        `SELECT p.*, s.name AS supplier_name
         FROM purchases p
         LEFT JOIN suppliers s ON s.id = p.supplier_id
         WHERE p.id = $1`,
        [purchase.id]
      );

      return attachItems(client, enriched[0]);
    });
  }

  async totalSpent(from: string, to: string): Promise<number> {
    const { rows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(total), 0)::text AS total FROM purchases WHERE created_at >= $1 AND created_at <= $2`,
      [from, to]
    );
    return Number(rows[0]?.total ?? 0);
  }
}
