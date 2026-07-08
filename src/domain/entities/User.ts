export type UserRole = "admin" | "gerente" | "funcionario";

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: UserRole;
  photo: string | null; // base64 data URL
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** User sem os campos sensíveis, seguro para trafegar pro client. */
export type PublicUser = Omit<User, "password_hash" | "password_salt">;

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, password_salt, ...rest } = user;
  return rest;
}

/** Papéis que podem ver dados financeiros (Dashboard financeiro, Financeiro, Relatórios). */
export const FINANCIAL_ROLES: UserRole[] = ["admin", "gerente"];

export function canViewFinancials(role: UserRole): boolean {
  return FINANCIAL_ROLES.includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
