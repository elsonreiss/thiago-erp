import Link from "next/link";
import { Plus, Pencil, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { container } from "@/container";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireUser();
  const { search } = await searchParams;
  const customers = await container.customerRepository.findAll(search);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Clientes</h1>
          <p className="text-sm text-text-secondary">{customers.length} cliente(s) cadastrado(s).</p>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <Plus size={16} /> Novo cliente
        </Link>
      </div>

      <form className="price-tag-card flex flex-wrap items-end gap-3 rounded-xl p-4">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Buscar</label>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Nome, documento, telefone ou e-mail"
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary">
          Filtrar
        </button>
      </form>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Cidade</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">Nenhum cliente encontrado.</td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ui-primary text-xs font-semibold text-ui-primary-foreground">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <Link href={`/clientes/${customer.id}`} className="font-medium text-text-primary hover:underline">
                      {customer.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{customer.document || "-"}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {customer.phone || customer.whatsapp ? (
                    <span className="flex items-center gap-1"><Phone size={13} /> {customer.phone || customer.whatsapp}</span>
                  ) : "-"}
                </td>
                <td className="px-4 py-3 text-text-secondary">{customer.city || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/clientes/${customer.id}`}
                      className="rounded-lg p-2 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteButton
                      endpoint={`/api/customers/${customer.id}`}
                      confirmMessage={`Excluir o cliente "${customer.name}"? Essa ação não pode ser desfeita.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
