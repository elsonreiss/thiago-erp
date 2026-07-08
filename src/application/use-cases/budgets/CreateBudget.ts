import { BudgetRepository, CreateBudgetInput } from "@/domain/repositories/BudgetRepository";
import { BudgetWithItems } from "@/domain/entities/Budget";

export class BudgetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetValidationError";
  }
}

function validate(input: CreateBudgetInput) {
  if (!input.items || input.items.length === 0) {
    throw new BudgetValidationError("Adicione ao menos um item ao orçamento.");
  }
  for (const item of input.items) {
    if (!item.product_id) throw new BudgetValidationError("Item inválido: produto não informado.");
    if (!item.quantity || item.quantity <= 0) {
      throw new BudgetValidationError("A quantidade de cada item deve ser maior que zero.");
    }
    const price = parseFloat(item.unit_price);
    if (!Number.isFinite(price) || price < 0) {
      throw new BudgetValidationError("Preço unitário inválido em um dos itens.");
    }
  }
  const discount = parseFloat(input.discount || "0");
  if (!Number.isFinite(discount) || discount < 0) {
    throw new BudgetValidationError("Desconto inválido.");
  }
}

export class CreateBudget {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(input: CreateBudgetInput): Promise<BudgetWithItems> {
    validate(input);
    return this.budgetRepository.create(input);
  }
}
