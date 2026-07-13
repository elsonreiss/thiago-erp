import { query } from "@/infrastructure/db";
import { Product } from "@/domain/entities/Product";
import {
  CreateProductInput,
  ProductFilters,
  ProductRepository,
  UpdateProductInput,
} from "@/domain/repositories/ProductRepository";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

function buildProductWhere(filters: ProductFilters): { where: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (filters.activeOnly !== false) {
    conditions.push(`active = true`);
  }
  if (filters.search && filters.search.trim()) {
    conditions.push(`(name ILIKE $${i} OR code ILIKE $${i} OR barcode ILIKE $${i} OR category ILIKE $${i})`);
    values.push(`%${filters.search.trim()}%`);
    i++;
  }
  if (filters.category && filters.category.trim()) {
    conditions.push(`category = $${i}`);
    values.push(filters.category);
    i++;
  }
  if (filters.stockStatus === "em_falta") {
    conditions.push(`quantity <= 0`);
  } else if (filters.stockStatus === "estoque_baixo") {
    conditions.push(`quantity > 0 AND quantity <= min_stock`);
  } else if (filters.stockStatus === "ok") {
    conditions.push(`quantity > min_stock`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", values };
}

export class PgProductRepository implements ProductRepository {
  async findById(id: number): Promise<Product | null> {
    const { rows } = await query<Product>("SELECT * FROM products WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const { rows } = await query<Product>("SELECT * FROM products WHERE lower(code) = lower($1)", [code]);
    return rows[0] ?? null;
  }

  async findByCodeOrBarcode(value: string): Promise<Product | null> {
    const { rows } = await query<Product>(
      `SELECT * FROM products
       WHERE active = true AND (lower(code) = lower($1) OR lower(barcode) = lower($1))
       ORDER BY (lower(code) = lower($1)) DESC
       LIMIT 1`,
      [value]
    );
    return rows[0] ?? null;
  }

  async findAll(filters: ProductFilters = {}): Promise<Product[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (filters.activeOnly !== false) {
      conditions.push(`active = true`);
    }

    if (filters.search && filters.search.trim()) {
      conditions.push(
        `(name ILIKE $${i} OR code ILIKE $${i} OR barcode ILIKE $${i} OR category ILIKE $${i})`
      );
      values.push(`%${filters.search.trim()}%`);
      i++;
    }

    if (filters.category && filters.category.trim()) {
      conditions.push(`category = $${i}`);
      values.push(filters.category);
      i++;
    }

    if (filters.stockStatus === "em_falta") {
      conditions.push(`quantity <= 0`);
    } else if (filters.stockStatus === "estoque_baixo") {
      conditions.push(`quantity > 0 AND quantity <= min_stock`);
    } else if (filters.stockStatus === "ok") {
      conditions.push(`quantity > min_stock`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query<Product>(
      `SELECT * FROM products ${where} ORDER BY name ASC`,
      values
    );
    return rows;
  }

  async findPage(filters: ProductFilters, page: number, pageSize: number): Promise<PaginatedResult<Product>> {
    const { where, values } = buildProductWhere(filters);
    const offset = (page - 1) * pageSize;

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products ${where}`,
      values
    );
    const total = Number(countRows[0]?.count ?? 0);

    const { rows } = await query<Product>(
      `SELECT * FROM products ${where} ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, offset]
    );

    return buildPaginatedResult(rows, total, page, pageSize);
  }

  async searchForAutocomplete(term: string, limit = 10): Promise<Product[]> {
    const { rows } = await query<Product>(
      `SELECT * FROM products
       WHERE active = true AND (name ILIKE $1 OR code ILIKE $1 OR category ILIKE $1 OR barcode ILIKE $1)
       ORDER BY name ASC
       LIMIT $2`,
      [`%${term}%`, limit]
    );
    return rows;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const { rows } = await query<Product>(
      `INSERT INTO products
        (code, barcode, name, category, brand, unit, description, photo, purchase_price, sale_price, min_stock, quantity, location, supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        input.code,
        input.barcode,
        input.name,
        input.category,
        input.brand,
        input.unit,
        input.description,
        input.photo,
        input.purchase_price,
        input.sale_price,
        input.min_stock,
        input.quantity,
        input.location,
        input.supplier_id,
      ]
    );
    return rows[0];
  }

  async update(id: number, input: UpdateProductInput): Promise<Product | null> {
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

    fields.push(`updated_at = now()`);
    values.push(id);

    const { rows } = await query<Product>(
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<void> {
    await query("DELETE FROM products WHERE id = $1", [id]);
  }

  async adjustQuantity(id: number, delta: number): Promise<void> {
    await query(
      "UPDATE products SET quantity = quantity + $1, updated_at = now() WHERE id = $2",
      [delta, id]
    );
  }

  async countTotal(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM products WHERE active = true"
    );
    return Number(rows[0]?.count ?? 0);
  }

  async countOutOfStock(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM products WHERE active = true AND quantity <= 0"
    );
    return Number(rows[0]?.count ?? 0);
  }

  async countLowStock(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM products WHERE active = true AND quantity > 0 AND quantity <= min_stock"
    );
    return Number(rows[0]?.count ?? 0);
  }

  async stockCostValue(): Promise<number> {
    const { rows } = await query<{ total: string }>(
      "SELECT COALESCE(SUM(purchase_price * quantity), 0)::text AS total FROM products WHERE active = true"
    );
    return Number(rows[0]?.total ?? 0);
  }

  async mostSold(limit: number, since?: string): Promise<Array<{ product: Product; total_quantity: number }>> {
    const params: unknown[] = [];
    let sinceClause = "";
    if (since) {
      params.push(since);
      sinceClause = `AND s.created_at >= $${params.length}`;
    }
    params.push(limit);

    const { rows } = await query<Product & { total_quantity: string }>(
      `SELECT p.*, COALESCE(SUM(si.quantity), 0)::text AS total_quantity
       FROM products p
       JOIN sale_items si ON si.product_id = p.id
       JOIN sales s ON s.id = si.sale_id
       WHERE 1=1 ${sinceClause}
       GROUP BY p.id
       ORDER BY SUM(si.quantity) DESC
       LIMIT $${params.length}`,
      params
    );

    return rows.map((row) => {
      const { total_quantity, ...product } = row;
      return { product: product as Product, total_quantity: Number(total_quantity) };
    });
  }

  async stagnant(daysSinceLastMovement: number): Promise<Product[]> {
    const { rows } = await query<Product>(
      `SELECT p.* FROM products p
       WHERE p.active = true
         AND NOT EXISTS (
           SELECT 1 FROM sale_items si
           JOIN sales s ON s.id = si.sale_id
           WHERE si.product_id = p.id AND s.created_at >= now() - ($1 || ' days')::interval
         )
         AND NOT EXISTS (
           SELECT 1 FROM purchase_items pi
           JOIN purchases pu ON pu.id = pi.purchase_id
           WHERE pi.product_id = p.id AND pu.created_at >= now() - ($1 || ' days')::interval
         )
       ORDER BY p.updated_at ASC`,
      [daysSinceLastMovement]
    );
    return rows;
  }
}
