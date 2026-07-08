import { UserRepository } from "@/domain/repositories/UserRepository";
import { SessionRepository } from "@/domain/repositories/SessionRepository";
import { verifyPassword } from "@/infrastructure/auth/password";
import { generateSessionToken, sessionExpiryDate } from "@/infrastructure/auth/session";
import { PublicUser, toPublicUser } from "@/domain/entities/User";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("E-mail ou senha inválidos.");
    this.name = "InvalidCredentialsError";
  }
}

export class UserInactiveError extends Error {
  constructor() {
    super("Usuário desativado. Fale com um administrador.");
    this.name = "UserInactiveError";
  }
}

export class Login {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository
  ) {}

  async execute(
    email: string,
    password: string
  ): Promise<{ user: PublicUser; token: string; expiresAt: Date }> {
    const user = await this.userRepository.findByEmail(email.trim());
    if (!user) throw new InvalidCredentialsError();

    const valid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) throw new InvalidCredentialsError();

    if (!user.active) throw new UserInactiveError();

    const token = generateSessionToken();
    const expiresAt = sessionExpiryDate();
    await this.sessionRepository.create(user.id, token, expiresAt.toISOString());

    return { user: toPublicUser(user), token, expiresAt };
  }
}
