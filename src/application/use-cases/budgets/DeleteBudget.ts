import { BudgetRepository } from "@/domain/repositories/BudgetRepository";

export class BudgetNotFoundError extends Error {
  constructor() {
    super("Orçamento não encontrado.");
    this.name = "BudgetNotFoundError";
  }
}

export class DeleteBudget {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.budgetRepository.findById(id);
    if (!existing) throw new BudgetNotFoundError();
    await this.budgetRepository.delete(id);
  }
}
