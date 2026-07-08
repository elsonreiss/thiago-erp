import { BudgetRepository } from "@/domain/repositories/BudgetRepository";
import { BudgetStatus, BudgetWithItems } from "@/domain/entities/Budget";

export class ListBudgets {
  constructor(private budgetRepository: BudgetRepository) {}

  execute(status?: BudgetStatus): Promise<BudgetWithItems[]> {
    return this.budgetRepository.findAll(status);
  }
}
