import { UserRepository, UpdateUserInput } from "@/domain/repositories/UserRepository";
import { User, UserRole } from "@/domain/entities/User";
import { hashPassword } from "@/infrastructure/auth/password";
import { UserValidationError, DuplicateUserEmailError } from "@/application/use-cases/users/CreateUser";

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuário não encontrado.");
    this.name = "UserNotFoundError";
  }
}

export class SelfLockoutError extends Error {
  constructor() {
    super("Você não pode desativar ou remover seu próprio papel de administrador.");
    this.name = "SelfLockoutError";
  }
}

const VALID_ROLES: UserRole[] = ["admin", "gerente", "funcionario"];

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
  password?: string;
}

export class UpdateUser {
  constructor(private userRepository: UserRepository) {}

  async execute(id: number, input: UpdateUserRequest, currentUserId: number): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new UserNotFoundError();

    if (id === currentUserId) {
      if (input.active === false) throw new SelfLockoutError();
      if (input.role && input.role !== "admin") throw new SelfLockoutError();
    }

    if (input.email && input.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const emailOwner = await this.userRepository.findByEmail(input.email.trim());
      if (emailOwner && emailOwner.id !== id) throw new DuplicateUserEmailError();
    }

    if (input.role && !VALID_ROLES.includes(input.role)) {
      throw new UserValidationError("Papel inválido.");
    }
    if (input.password && input.password.length < 6) {
      throw new UserValidationError("A senha deve ter pelo menos 6 caracteres.");
    }

    const patch: UpdateUserInput = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.email !== undefined) patch.email = input.email.trim().toLowerCase();
    if (input.role !== undefined) patch.role = input.role;
    if (input.active !== undefined) patch.active = input.active;
    if (input.password) {
      const { hash, salt } = await hashPassword(input.password);
      patch.password_hash = hash;
      patch.password_salt = salt;
    }

    const updated = await this.userRepository.update(id, patch);
    if (!updated) throw new UserNotFoundError();
    return updated;
  }
}
