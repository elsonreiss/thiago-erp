import { ExpenseRepository } from "@/domain/repositories/ExpenseRepository";

export class ExpenseNotFoundError extends Error {
  constructor() {
    super("Despesa não encontrada.");
    this.name = "ExpenseNotFoundError";
  }
}

export class DeleteExpense {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) throw new ExpenseNotFoundError();
    await this.expenseRepository.delete(id);
  }
}
