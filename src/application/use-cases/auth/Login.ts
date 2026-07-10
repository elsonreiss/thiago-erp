import { UserRepository } from "@/domain/repositories/UserRepository";
import { SessionRepository } from "@/domain/repositories/SessionRepository";
import { verifyPassword } from "@/infrastructure/auth/password";
import { generateSessionToken, sessionExpiryDate } from "@/infrastructure/auth/session";
import { PublicUser, toPublicUser } from "@/domain/entities/User";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

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

export class AccountLockedError extends Error {
  constructor(minutesRemaining: number) {
    super(
      `Muitas tentativas de login incorretas. Tente novamente em ${minutesRemaining} minuto${
        minutesRemaining === 1 ? "" : "s"
      }.`
    );
    this.name = "AccountLockedError";
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

    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until).getTime();
      if (lockedUntil > Date.now()) {
        const minutesRemaining = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
        throw new AccountLockedError(minutesRemaining);
      }
    }

    const valid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) {
      const attempts = await this.userRepository.incrementFailedLoginAttempts(user.id);
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
        await this.userRepository.setLockUntil(user.id, until);
        throw new AccountLockedError(LOCK_MINUTES);
      }
      throw new InvalidCredentialsError();
    }

    if (!user.active) throw new UserInactiveError();

    await this.userRepository.resetFailedLoginAttempts(user.id);

    const token = generateSessionToken();
    const expiresAt = sessionExpiryDate();
    await this.sessionRepository.create(user.id, token, expiresAt.toISOString());

    return { user: toPublicUser(user), token, expiresAt };
  }
}
