import { BudgetRepository } from "@/domain/repositories/BudgetRepository";
import { SaleRepository } from "@/domain/repositories/SaleRepository";
import { PaymentMethod, SaleWithItems } from "@/domain/entities/Sale";

export class BudgetNotFoundError extends Error {
  constructor() {
    super("Orçamento não encontrado.");
    this.name = "BudgetNotFoundError";
  }
}

export class BudgetAlreadyConvertedError extends Error {
  constructor() {
    super("Este orçamento já foi convertido em venda.");
    this.name = "BudgetAlreadyConvertedError";
  }
}

/** Converte um orçamento em venda de verdade: cria a venda (com baixa de estoque) e marca o orçamento como convertido. */
export class ConvertBudgetToSale {
  constructor(
    private budgetRepository: BudgetRepository,
    private saleRepository: SaleRepository
  ) {}

  async execute(
    budgetId: number,
    input: { user_id: number; payment_method: PaymentMethod }
  ): Promise<SaleWithItems> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) throw new BudgetNotFoundError();
    if (budget.status === "convertido") throw new BudgetAlreadyConvertedError();

    const sale = await this.saleRepository.create({
      customer_id: budget.customer_id,
      user_id: input.user_id,
      payment_method: input.payment_method,
      discount: budget.discount,
      notes: budget.notes ? `Convertido a partir de um orçamento. ${budget.notes}` : `Convertido a partir de um orçamento.`,
      items: budget.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });

    await this.budgetRepository.markConverted(budgetId, sale.id);

    return sale;
  }
}
