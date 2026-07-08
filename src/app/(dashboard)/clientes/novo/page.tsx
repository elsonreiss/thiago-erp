import { requireUser } from "@/lib/auth";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default async function NovoClientePage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Novo cliente</h1>
        <p className="text-sm text-text-secondary">Cadastre um novo cliente.</p>
      </div>
      <CustomerForm />
    </div>
  );
}
