"use client";

import { Printer } from "lucide-react";
import { useSalePrint } from "@/components/sales/SalePrintContext";

/**
 * "Baixar PDF" e "Imprimir Cupom 80mm" — os dois disparam a impressão direto
 * nesta mesma página (o navegador oferece "Salvar como PDF" como destino),
 * sem navegar pra nenhuma outra rota.
 */
export function SalePrintButtons() {
  const { printAs } = useSalePrint();

  return (
    <>
      <button
        type="button"
        onClick={() => printAs("a4")}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
      >
        <Printer size={16} /> Baixar PDF
      </button>
      <button
        type="button"
        onClick={() => printAs("80")}
        className="flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
      >
        <Printer size={16} /> Imprimir Cupom 80mm
      </button>
    </>
  );
}
