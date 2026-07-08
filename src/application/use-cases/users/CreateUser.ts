import { UserRepository } from "@/domain/repositories/UserRepository";
import { User, UserRole } from "@/domain/entities/User";
import { hashPassword } from "@/infrastructure/auth/password";

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserValidationError";
  }
}

export class DuplicateUserEmailError extends Error {
  constructor() {
    super("Já existe um usuário cadastrado com esse e-mail.");
    this.name = "DuplicateUserEmailError";
  }
}

const VALID_ROLES: UserRole[] = ["admin", "gerente", "funcionario"];

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

function validate(input: CreateUserRequest) {
  if (!input.name?.trim()) throw new UserValidationError("Nome é obrigatório.");
  if (!input.email?.trim() || !input.email.includes("@")) {
    throw new UserValidationError("E-mail inválido.");
  }
  if (!input.password || input.password.length < 6) {
    throw new UserValidationError("A senha deve ter pelo menos 6 caracteres.");
  }
  if (!VALID_ROLES.includes(input.role)) {
    throw new UserValidationError("Papel inválido.");
  }
}

export class CreateUser {
  constructor(private userRepository: UserRepository) {}

  async execute(input: CreateUserRequest): Promise<User> {
    validate(input);

    const existing = await this.userRepository.findByEmail(input.email.trim());
    if (existing) throw new DuplicateUserEmailError();

    const { hash, salt } = await hashPassword(input.password);

    return this.userRepository.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password_hash: hash,
      password_salt: salt,
      role: input.role,
    });
  }
}
