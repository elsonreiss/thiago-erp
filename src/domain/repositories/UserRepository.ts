import { User } from "@/domain/entities/User";

export interface CreateUserInput {
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: User["role"];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: User["role"];
  active?: boolean;
  password_hash?: string;
  password_salt?: string;
  photo?: string | null;
}

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(input: CreateUserInput): Promise<User>;
  update(id: number, input: UpdateUserInput): Promise<User | null>;
  updatePhoto(id: number, photo: string | null): Promise<User | null>;
  /** Incrementa o contador de tentativas de login falhas e retorna o novo valor. */
  incrementFailedLoginAttempts(id: number): Promise<number>;
  /** Bloqueia o login até a data/hora informada. */
  setLockUntil(id: number, until: string | null): Promise<void>;
  /** Zera o contador de tentativas e remove o bloqueio (usado no login bem-sucedido). */
  resetFailedLoginAttempts(id: number): Promise<void>;
}
