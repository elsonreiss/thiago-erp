import { query } from "@/infrastructure/db";
import { Customer } from "@/domain/entities/Customer";
import {
  CreateCustomerInput,
  CustomerRepository,
  UpdateCustomerInput,
} from "@/domain/repositories/CustomerRepository";

export class PgCustomerRepository implements CustomerRepository {
  async findById(id: number): Promise<Customer | null> {
    const { rows } = await query<Customer>("SELECT * FROM customers WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  async findAll(search?: string): Promise<Customer[]> {
    if (search && search.trim()) {
      const { rows } = await query<Customer>(
        `SELECT * FROM customers
         WHERE active = true AND (name ILIKE $1 OR document ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)
         ORDER BY name ASC`,
        [`%${search.trim()}%`]
      );
      return rows;
    }
    const { rows } = await query<Customer>("SELECT * FROM customers WHERE active = true ORDER BY name ASC");
    return rows;
  }

  async searchForAutocomplete(term: string, limit = 10): Promise<Customer[]> {
    const { rows } = await query<Customer>(
      `SELECT * FROM customers
       WHERE active = true AND (name ILIKE $1 OR document ILIKE $1 OR phone ILIKE $1)
       ORDER BY name ASC
       LIMIT $2`,
      [`%${term}%`, limit]
    );
    return rows;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const { rows } = await query<Customer>(
      `INSERT INTO customers (name, document, phone, whatsapp, email, address, city, state, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        input.name,
        input.document,
        input.phone,
        input.whatsapp,
        input.email,
        input.address,
        input.city,
        input.state,
        input.notes,
      ]
    );
    return rows[0];
  }

  async update(id: number, input: UpdateCustomerInput): Promise<Customer | null> {
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

    const { rows } = await query<Customer>(
      `UPDATE customers SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<void> {
    await query("DELETE FROM customers WHERE id = $1", [id]);
  }

  async topBuyers(limit: number, since?: string): Promise<Array<{ customer: Customer; total_spent: number }>> {
    const params: unknown[] = [];
    let sinceClause = "";
    if (since) {
      params.push(since);
      sinceClause = `AND s.created_at >= $${params.length}`;
    }
    params.push(limit);

    const { rows } = await query<Customer & { total_spent: string }>(
      `SELECT c.*, COALESCE(SUM(s.total), 0)::text AS total_spent
       FROM customers c
       JOIN sales s ON s.customer_id = c.id
       WHERE 1=1 ${sinceClause}
       GROUP BY c.id
       ORDER BY SUM(s.total) DESC
       LIMIT $${params.length}`,
      params
    );

    return rows.map((row) => {
      const { total_spent, ...customer } = row;
      return { customer: customer as Customer, total_spent: Number(total_spent) };
    });
  }
}
