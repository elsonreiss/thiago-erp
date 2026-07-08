import { BudgetRepository } from "@/domain/repositories/BudgetRepository";
import { BudgetWithItems } from "@/domain/entities/Budget";

export class GetBudget {
  constructor(private budgetRepository: BudgetRepository) {}

  execute(id: number): Promise<BudgetWithItems | null> {
    return this.budgetRepository.findById(id);
  }
}
