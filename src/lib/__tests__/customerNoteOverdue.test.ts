import { describe, expect, it } from "vitest";
import { isNoteOverdue } from "@/lib/customerNoteOverdue";

describe("isNoteOverdue", () => {
  it("retorna false quando não tem due_date", () => {
    expect(isNoteOverdue({ due_date: null, status: "aberto" })).toBe(false);
  });

  it("retorna false quando a nota já está paga, mesmo com vencimento passado", () => {
    expect(isNoteOverdue({ due_date: "2020-01-01", status: "pago" })).toBe(false);
  });

  it("retorna true quando o vencimento já passou e a nota não está paga", () => {
    expect(isNoteOverdue({ due_date: "2020-01-01", status: "aberto" })).toBe(true);
    expect(isNoteOverdue({ due_date: "2020-01-01", status: "parcial" })).toBe(true);
  });

  it("retorna false quando o vencimento é no futuro", () => {
    expect(isNoteOverdue({ due_date: "2099-01-01", status: "aberto" })).toBe(false);
  });
});
