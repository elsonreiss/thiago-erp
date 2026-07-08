import { PaymentMethod } from "@/domain/entities/Sale";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  boleto: "Boleto",
  fiado: "Fiado",
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  "dinheiro",
  "pix",
  "cartao_debito",
  "cartao_credito",
  "boleto",
  "fiado",
];
