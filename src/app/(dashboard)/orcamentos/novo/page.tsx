import { requireUser } from "@/lib/auth";
import { BudgetForm } from "@/components/budgets/BudgetForm";

export default async function NovoOrcamentoPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Novo orçamento</h1>
        <p className="text-sm text-text-secondary">
          Proposta de venda sem baixa de estoque. Pode ser convertida em venda depois.
        </p>
      </div>
      <BudgetForm sellerName={user.name} />
    </div>
  );
}
