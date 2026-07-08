import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { container } from "@/container";
import { Logout } from "@/application/use-cases/auth/Logout";
import { SESSION_COOKIE_NAME } from "@/infrastructure/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const logout = new Logout(container.sessionRepository);
    await logout.execute(token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
