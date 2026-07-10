import { CashClosingRepository, UpsertCashClosingInput } from "@/domain/repositories/CashClosingRepository";
import { SaleRepository } from "@/domain/repositories/SaleRepository";
import { CashClosingWithUser } from "@/domain/entities/CashClosing";

export class CashClosingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CashClosingValidationError";
  }
}

/**
 * Registra (ou corrige) o fechamento de caixa de um dia: compara o dinheiro
 * esperado (troco inicial + vendas em dinheiro daquele dia, calculado pelo
 * sistema) com o valor contado fisicamente, e guarda a diferença.
 */
export class RegisterCashClosing {
  constructor(
    private cashClosingRepository: CashClosingRepository,
    private saleRepository: SaleRepository
  ) {}

  async execute(input: UpsertCashClosingInput): Promise<CashClosingWithUser> {
    if (!input.closing_date) {
      throw new CashClosingValidationError("Data do fechamento é obrigatória.");
    }
    const opening = parseFloat(input.opening_amount || "0");
    if (!Number.isFinite(opening) || opening < 0) {
      throw new CashClosingValidationError("Troco inicial inválido.");
    }
    const counted = parseFloat(input.counted_cash || "0");
    if (!Number.isFinite(counted) || counted < 0) {
      throw new CashClosingValidationError("Valor contado inválido.");
    }

    const breakdown = await this.saleRepository.revenueByPaymentMethodForDay(input.closing_date);
    const salesCash = breakdown.find((b) => b.payment_method === "dinheiro")?.total ?? 0;

    return this.cashClosingRepository.upsert(input, salesCash.toFixed(2));
  }
}
