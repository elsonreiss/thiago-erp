import { query } from "@/infrastructure/db";
import { Session } from "@/domain/entities/Session";
import { SessionRepository } from "@/domain/repositories/SessionRepository";

export class PgSessionRepository implements SessionRepository {
  async create(userId: number, token: string, expiresAt: string): Promise<Session> {
    const { rows } = await query<Session>(
      `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3) RETURNING *`,
      [token, userId, expiresAt]
    );
    return rows[0];
  }

  async findByToken(token: string): Promise<Session | null> {
    const { rows } = await query<Session>(
      `SELECT * FROM sessions WHERE token = $1 AND expires_at > now()`,
      [token]
    );
    return rows[0] ?? null;
  }

  async deleteByToken(token: string): Promise<void> {
    await query(`DELETE FROM sessions WHERE token = $1`, [token]);
  }

  async deleteAllForUser(userId: number): Promise<void> {
    await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  }
}
