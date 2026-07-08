import { requireUser } from "@/lib/auth";
import { CustomerNoteForm } from "@/components/customerNotes/CustomerNoteForm";

export default async function NovaNotaClientePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Nova nota de cliente</h1>
        <p className="text-sm text-text-secondary">
          Registre o que o cliente levou fiado. O estoque é baixado na hora; o valor só entra no
          financeiro quando a nota for marcada como paga.
        </p>
      </div>
      <CustomerNoteForm sellerName={user.name} />
    </div>
  );
}
