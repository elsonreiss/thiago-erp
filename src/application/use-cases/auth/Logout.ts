import { SessionRepository } from "@/domain/repositories/SessionRepository";

export class Logout {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(token: string): Promise<void> {
    await this.sessionRepository.deleteByToken(token);
  }
}
