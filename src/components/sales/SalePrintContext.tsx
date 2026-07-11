"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { SaleWithItems } from "@/domain/entities/Sale";

type PrintMode = "a4" | "80" | null;

interface SalePrintCtxValue {
  mode: PrintMode;
  printAs: (mode: "a4" | "80") => void;
  sale: SaleWithItems;
  storeName: string;
  companyDetail: string | null;
}

const SalePrintCtx = createContext<SalePrintCtxValue | null>(null);

/**
 * Compartilha o estado de "qual formato imprimir" entre os botões da barra de
 * ações (dentro da área "print:hidden") e o conteúdo de impressão escondido
 * (fora dessa área) — permite "Baixar PDF" e "Imprimir Cupom 80mm" dispararem
 * a impressão sem sair/navegar da página de detalhes da venda.
 */
export function SalePrintProvider({
  sale,
  storeName = "Thiago Casa & Construção",
  companyDetail = null,
  children,
}: {
  sale: SaleWithItems;
  storeName?: string;
  companyDetail?: string | null;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<PrintMode>(null);
  const pendingRef = useRef(false);

  // Espera o conteúdo/@page do modo escolhido renderizar antes de abrir a
  // caixa de impressão do navegador.
  useEffect(() => {
    if (pendingRef.current && mode) {
      pendingRef.current = false;
      const t = setTimeout(() => window.print(), 50);
      return () => clearTimeout(t);
    }
  }, [mode]);

  function printAs(next: "a4" | "80") {
    pendingRef.current = true;
    setMode(next);
  }

  return (
    <SalePrintCtx.Provider value={{ mode, printAs, sale, storeName, companyDetail }}>
      {children}
    </SalePrintCtx.Provider>
  );
}

export function useSalePrint() {
  const ctx = useContext(SalePrintCtx);
  if (!ctx) throw new Error("useSalePrint precisa estar dentro de <SalePrintProvider>.");
  return ctx;
}
