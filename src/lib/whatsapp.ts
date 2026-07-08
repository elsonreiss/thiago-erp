/**
 * Converte um telefone em qualquer formato pro padrão que o link wa.me espera
 * (só dígitos, com DDI). Assume Brasil (55) quando o número não tem DDI.
 */
export function toWhatsAppDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/** Monta o link do WhatsApp (wa.me) já com a mensagem preenchida. Sem telefone, abre a tela de escolher contato. */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  const digits = toWhatsAppDigits(phone);
  const encoded = encodeURIComponent(message);
  return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
