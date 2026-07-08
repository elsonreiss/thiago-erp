import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/container";
import { GetCurrentUser } from "@/application/use-cases/auth/GetCurrentUser";
import { SESSION_COOKIE_NAME } from "@/infrastructure/auth/session";
import { PublicUser, canViewFinancials, isAdmin } from "@/domain/entities/User";

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const useCase = new GetCurrentUser(container.userRepository, container.sessionRepository);
  return useCase.execute(token);
}

export async function currentUserCanViewFinancials(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && canViewFinancials(user.role);
}

export async function currentUserIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && isAdmin(user.role);
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireFinancialAccess(): Promise<PublicUser> {
  const user = await requireUser();
  if (!canViewFinancials(user.role)) redirect("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (!isAdmin(user.role)) redirect("/dashboard");
  return user;
}
