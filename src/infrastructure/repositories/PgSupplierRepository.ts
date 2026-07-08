import { query } from "@/infrastructure/db";
import { Supplier } from "@/domain/entities/Supplier";
import {
  CreateSupplierInput,
  SupplierRepository,
  UpdateSupplierInput,
} from "@/domain/repositories/SupplierRepository";

export class PgSupplierRepository implements SupplierRepository {
  async findById(id: number): Promise<Supplier | null> {
    const { rows } = await query<Supplier>("SELECT * FROM suppliers WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  async findAll(search?: string): Promise<Supplier[]> {
    if (search && search.trim()) {
      const { rows } = await query<Supplier>(
        `SELECT * FROM suppliers
         WHERE active = true AND (name ILIKE $1 OR cnpj ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)
         ORDER BY name ASC`,
        [`%${search.trim()}%`]
      );
      return rows;
    }
    const { rows } = await query<Supplier>("SELECT * FROM suppliers WHERE active = true ORDER BY name ASC");
    return rows;
  }

  async searchForAutocomplete(term: string, limit = 10): Promise<Supplier[]> {
    const { rows } = await query<Supplier>(
      `SELECT * FROM suppliers
       WHERE active = true AND (name ILIKE $1 OR cnpj ILIKE $1)
       ORDER BY name ASC
       LIMIT $2`,
      [`%${term}%`, limit]
    );
    return rows;
  }

  async create(input: CreateSupplierInput): Promise<Supplier> {
    const { rows } = await query<Supplier>(
      `INSERT INTO suppliers (name, cnpj, contact_name, phone, whatsapp, email, address, city, state, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        input.name,
        input.cnpj,
        input.contact_name,
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

  async update(id: number, input: UpdateSupplierInput): Promise<Supplier | null> {
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

    const { rows } = await query<Supplier>(
      `UPDATE suppliers SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<void> {
    await query("DELETE FROM suppliers WHERE id = $1", [id]);
  }
}
