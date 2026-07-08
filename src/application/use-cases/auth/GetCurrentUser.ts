import { UserRepository } from "@/domain/repositories/UserRepository";
import { SessionRepository } from "@/domain/repositories/SessionRepository";
import { PublicUser, toPublicUser } from "@/domain/entities/User";

export class GetCurrentUser {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository
  ) {}

  async execute(token: string | undefined): Promise<PublicUser | null> {
    if (!token) return null;

    const session = await this.sessionRepository.findByToken(token);
    if (!session) return null;

    const user = await this.userRepository.findById(session.user_id);
    if (!user || !user.active) return null;

    return toPublicUser(user);
  }
}
