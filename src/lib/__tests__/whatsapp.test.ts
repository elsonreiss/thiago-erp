import { describe, expect, it } from "vitest";
import { toWhatsAppDigits, buildWhatsAppLink } from "@/lib/whatsapp";

describe("toWhatsAppDigits", () => {
  it("retorna null para telefone vazio ou nulo", () => {
    expect(toWhatsAppDigits(null)).toBeNull();
    expect(toWhatsAppDigits(undefined)).toBeNull();
    expect(toWhatsAppDigits("")).toBeNull();
  });

  it("adiciona DDI 55 para número de 11 dígitos (com DDD e 9)", () => {
    expect(toWhatsAppDigits("(11) 98765-4321")).toBe("5511987654321");
  });

  it("adiciona DDI 55 para número de 10 dígitos (fixo com DDD)", () => {
    expect(toWhatsAppDigits("(11) 3456-7890")).toBe("551134567890");
  });

  it("mantém o número como está quando já tem DDI 55", () => {
    expect(toWhatsAppDigits("5511987654321")).toBe("5511987654321");
  });
});

describe("buildWhatsAppLink", () => {
  it("monta link wa.me com número e mensagem codificada", () => {
    const link = buildWhatsAppLink("11987654321", "Olá mundo");
    expect(link).toBe("https://wa.me/5511987654321?text=Ol%C3%A1%20mundo");
  });

  it("monta link genérico sem número quando telefone é nulo", () => {
    const link = buildWhatsAppLink(null, "Teste");
    expect(link).toBe("https://wa.me/?text=Teste");
  });
});
