import { describe, expect, it } from "vitest";
import { parsePage, buildPaginatedResult, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

describe("parsePage", () => {
  it("retorna 1 quando não informado", () => {
    expect(parsePage(undefined)).toBe(1);
  });

  it("converte string numérica válida", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("nunca retorna menor que 1", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-5")).toBe(1);
  });

  it("trata valor não numérico como página 1", () => {
    expect(parsePage("abc")).toBe(1);
  });
});

describe("buildPaginatedResult", () => {
  it("calcula totalPages corretamente", () => {
    const result = buildPaginatedResult([1, 2, 3], 45, 1, DEFAULT_PAGE_SIZE);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(Math.ceil(45 / DEFAULT_PAGE_SIZE));
    expect(result.page).toBe(1);
    expect(result.items).toEqual([1, 2, 3]);
  });

  it("retorna totalPages mínimo de 1 mesmo sem itens", () => {
    const result = buildPaginatedResult([], 0, 1, DEFAULT_PAGE_SIZE);
    expect(result.totalPages).toBe(1);
  });
});
