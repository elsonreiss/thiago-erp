import { BudgetRepository } from "@/domain/repositories/BudgetRepository";
import { BudgetStatus, BudgetWithItems } from "@/domain/entities/Budget";

export class BudgetNotFoundError extends Error {
  constructor() {
    super("Orçamento não encontrado.");
    this.name = "BudgetNotFoundError";
  }
}

export class BudgetAlreadyConvertedError extends Error {
  constructor() {
    super("Este orçamento já foi convertido em venda e não pode ser alterado.");
    this.name = "BudgetAlreadyConvertedError";
  }
}

const VALID_STATUSES: BudgetStatus[] = ["pendente", "aprovado", "recusado", "convertido", "expirado"];

export class UpdateBudgetStatus {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(id: number, status: BudgetStatus): Promise<BudgetWithItems> {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error("Status inválido.");
    }
    const existing = await this.budgetRepository.findById(id);
    if (!existing) throw new BudgetNotFoundError();
    if (existing.status === "convertido") throw new BudgetAlreadyConvertedError();

    const updated = await this.budgetRepository.updateStatus(id, status);
    if (!updated) throw new BudgetNotFoundError();
    return updated;
  }
}
