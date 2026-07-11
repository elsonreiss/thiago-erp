"use client";

import { Printer } from "lucide-react";

/**
 * Botão genérico "Baixar PDF" que imprime direto na página atual (o
 * navegador oferece "Salvar como PDF" como destino), sem navegar pra
 * nenhuma outra rota. Usa o conteúdo escondido ("hidden print:block")
 * renderizado em algum componente irmão fora da área "print:hidden".
 */
export function DownloadPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
    >
      <Printer size={16} /> Baixar PDF
    </button>
  );
}
