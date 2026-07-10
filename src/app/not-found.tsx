import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-secondary px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ui-primary p-2.5 text-ui-primary-foreground">
        <Logo className="h-full w-full" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-text-muted">
          <SearchX size={20} />
          <span className="font-numeric text-sm">404</span>
        </div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Página não encontrada</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
      >
        <Home size={16} /> Voltar ao início
      </Link>
    </div>
  );
}
