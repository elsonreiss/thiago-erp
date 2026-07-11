import { describe, it, expect } from "vitest";
import { isValidCPF, isValidCNPJ, isValidDocument, formatDocument } from "@/lib/documentValidation";

describe("isValidCPF", () => {
  it("aceita CPF válido conhecido", () => {
    expect(isValidCPF("111.444.777-35")).toBe(true);
    expect(isValidCPF("11144477735")).toBe(true);
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(isValidCPF("111.444.777-36")).toBe(false);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });

  it("rejeita CPF com tamanho errado", () => {
    expect(isValidCPF("123")).toBe(false);
  });
});

describe("isValidCNPJ", () => {
  it("aceita CNPJ válido conhecido", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11222333000181")).toBe(true);
  });

  it("rejeita CNPJ com dígito verificador errado", () => {
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false);
  });

  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
  });
});

describe("isValidDocument", () => {
  it("detecta CPF automaticamente pelo tamanho", () => {
    expect(isValidDocument("111.444.777-35")).toBe(true);
  });

  it("detecta CNPJ automaticamente pelo tamanho", () => {
    expect(isValidDocument("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita tamanho que não é nem CPF nem CNPJ", () => {
    expect(isValidDocument("12345")).toBe(false);
  });
});

describe("formatDocument", () => {
  it("formata CPF", () => {
    expect(formatDocument("11144477735")).toBe("111.444.777-35");
  });

  it("formata CNPJ", () => {
    expect(formatDocument("11222333000181")).toBe("11.222.333/0001-81");
  });
});
