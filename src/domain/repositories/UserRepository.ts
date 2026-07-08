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
}
