"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-secondary px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ui-primary p-2.5 text-ui-primary-foreground">
        <Logo className="h-full w-full" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">Algo deu errado</span>
        </div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Ocorreu um erro inesperado</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          Tente novamente. Se o problema continuar, entre em contato com o suporte.
        </p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
      >
        <RotateCcw size={16} /> Tentar novamente
      </button>
    </div>
  );
}
