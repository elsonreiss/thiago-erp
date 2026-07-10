import { query } from "@/infrastructure/db";
import { User } from "@/domain/entities/User";
import {
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
} from "@/domain/repositories/UserRepository";

export class PgUserRepository implements UserRepository {
  async findById(id: number): Promise<User | null> {
    const { rows } = await query<User>("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await query<User>(
      "SELECT * FROM users WHERE lower(email) = lower($1)",
      [email]
    );
    return rows[0] ?? null;
  }

  async findAll(): Promise<User[]> {
    const { rows } = await query<User>("SELECT * FROM users ORDER BY name ASC");
    return rows;
  }

  async create(input: CreateUserInput): Promise<User> {
    const { rows } = await query<User>(
      `INSERT INTO users (name, email, password_hash, password_salt, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.name, input.email, input.password_hash, input.password_salt, input.role]
    );
    return rows[0];
  }

  async update(id: number, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
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

    const { rows } = await query<User>(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  }

  async updatePhoto(id: number, photo: string | null): Promise<User | null> {
    const { rows } = await query<User>(
      `UPDATE users SET photo = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [photo, id]
    );
    return rows[0] ?? null;
  }

  async incrementFailedLoginAttempts(id: number): Promise<number> {
    const { rows } = await query<{ failed_login_attempts: number }>(
      `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1
       RETURNING failed_login_attempts`,
      [id]
    );
    return rows[0]?.failed_login_attempts ?? 0;
  }

  async setLockUntil(id: number, until: string | null): Promise<void> {
    await query(`UPDATE users SET locked_until = $1 WHERE id = $2`, [until, id]);
  }

  async resetFailedLoginAttempts(id: number): Promise<void> {
    await query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
      [id]
    );
  }
}
