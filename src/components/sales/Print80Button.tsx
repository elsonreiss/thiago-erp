"use client";

import { Printer } from "lucide-react";

/**
 * Dispara a impressão direto nesta mesma página (sem navegar pra outra rota).
 * O conteúdo do cupom fica renderizado escondido em <ThermalReceipt80 />, que
 * só aparece via CSS "print:block" na hora de imprimir.
 */
export function Print80Button() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
    >
      <Printer size={16} /> Imprimir Cupom 80mm
    </button>
  );
}
