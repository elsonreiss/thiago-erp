import { ExpenseRepository, CreateExpenseInput } from "@/domain/repositories/ExpenseRepository";
import { Expense } from "@/domain/entities/Expense";

export class ExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpenseValidationError";
  }
}

function validate(input: CreateExpenseInput) {
  if (!input.description?.trim()) throw new ExpenseValidationError("Descrição é obrigatória.");
  if (!input.category?.trim()) throw new ExpenseValidationError("Categoria é obrigatória.");
  const amount = parseFloat(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ExpenseValidationError("Valor deve ser maior que zero.");
  }
  if (!input.expense_date) throw new ExpenseValidationError("Data é obrigatória.");
}

export class CreateExpense {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(input: CreateExpenseInput): Promise<Expense> {
    validate(input);
    return this.expenseRepository.create(input);
  }
}
