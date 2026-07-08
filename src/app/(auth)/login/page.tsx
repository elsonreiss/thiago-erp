import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/layout/Logo";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ui-primary p-2.5 text-ui-primary-foreground">
            <Logo className="h-full w-full" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-text-primary">Thiago Casa &amp; Construção</h1>
            <p className="text-sm text-text-secondary">Entre com seu e-mail e senha</p>
          </div>
        </div>

        <div className="price-tag-card rounded-xl p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
