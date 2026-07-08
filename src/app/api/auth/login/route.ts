import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { container } from "@/container";
import { Login, InvalidCredentialsError, UserInactiveError } from "@/application/use-cases/auth/Login";
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/infrastructure/auth/session";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const login = new Login(container.userRepository, container.sessionRepository);

  try {
    const { user, token } = await login.execute(email, password);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof InvalidCredentialsError || err instanceof UserInactiveError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Erro ao entrar. Tente novamente." }, { status: 500 });
  }
}
