import { describe, expect, it } from "vitest";
import { formatCurrency, parseCurrencyInput, formatDate, formatNumber } from "@/lib/format";

/** Normaliza espaços (o Intl.NumberFormat usa NBSP entre "R$" e o valor, dependendo do runtime/ICU). */
function normalize(value: string): string {
  return value.replace(/\u00a0/g, " ");
}

describe("formatCurrency", () => {
  it("formata número em reais", () => {
    expect(normalize(formatCurrency(1234.5))).toBe("R$ 1.234,50");
  });

  it("formata string numérica", () => {
    expect(normalize(formatCurrency("99.9"))).toBe("R$ 99,90");
  });

  it("trata valores nulos/undefined como zero", () => {
    expect(normalize(formatCurrency(null))).toBe("R$ 0,00");
    expect(normalize(formatCurrency(undefined))).toBe("R$ 0,00");
  });

  it("trata valores não numéricos como zero", () => {
    expect(normalize(formatCurrency("abc"))).toBe("R$ 0,00");
  });
});

describe("parseCurrencyInput", () => {
  it("converte vírgula em ponto decimal", () => {
    expect(parseCurrencyInput("1.234,56")).toBe("1234.56");
  });

  it("converte valor simples com vírgula", () => {
    expect(parseCurrencyInput("10,5")).toBe("10.50");
  });

  it("retorna 0.00 para entrada inválida", () => {
    expect(parseCurrencyInput("abc")).toBe("0.00");
  });

  it("retorna 0.00 para string vazia", () => {
    expect(parseCurrencyInput("")).toBe("0.00");
  });
});

describe("formatDate", () => {
  it("formata data ISO em dd/mm/aaaa", () => {
    expect(formatDate("2026-07-10")).toBe("10/07/2026");
  });

  it("formata timestamp completo pegando só a parte da data", () => {
    expect(formatDate("2026-07-10T14:30:00.000Z")).toBe("10/07/2026");
  });

  it("retorna '-' para valor nulo", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });
});

describe("formatNumber", () => {
  it("formata número inteiro", () => {
    expect(formatNumber(1000)).toBe("1.000");
  });

  it("trata nulo como zero", () => {
    expect(formatNumber(null)).toBe("0");
  });
});
