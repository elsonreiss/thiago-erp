export const DEFAULT_EXPENSE_CATEGORIES = [
  "Aluguel",
  "Salários",
  "Fornecedores",
  "Energia",
  "Água",
  "Internet/Telefone",
  "Impostos",
  "Manutenção",
  "Transporte/Frete",
  "Marketing",
  "Outros",
] as const;

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: string;
  expense_date: string;
  notes: string | null;
  created_at: string;
}
