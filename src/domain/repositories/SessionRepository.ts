import { Session } from "@/domain/entities/Session";

export interface SessionRepository {
  create(userId: number, token: string, expiresAt: string): Promise<Session>;
  findByToken(token: string): Promise<Session | null>;
  deleteByToken(token: string): Promise<void>;
  deleteAllForUser(userId: number): Promise<void>;
}
