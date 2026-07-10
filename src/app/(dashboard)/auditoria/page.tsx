import { Trash2, ShieldCheck, PiggyBank } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { container } from "@/container";
import { formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";

interface SearchParams {
  page?: string;
}

const ACTION_LABELS: Record<string, string> = {
  delete: "Exclusão",
  register: "Registro",
  update_permissions: "Alteração de permissão",
};

const ENTITY_LABELS: Record<string, string> = {
  product: "Produto",
  sale: "Venda",
  customer_note: "Nota de cliente",
  cash_closing: "Fechamento de caixa",
  user: "Usuário",
};

function iconFor(entityType: string) {
  if (entityType === "cash_closing") return PiggyBank;
  if (entityType === "user") return ShieldCheck;
  return Trash2;
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = parsePage(params.page);

  const logPage = await container.auditLogRepository.findPage(page, DEFAULT_PAGE_SIZE);
  const logs = logPage.items;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Auditoria</h1>
        <p className="text-sm text-text-secondary">
          Histórico de ações sensíveis: exclusões, fechamentos de caixa e mudanças de permissão.
        </p>
      </div>

      <div className="price-tag-card overflow-x-auto rounded-xl">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                  Nenhum registro de auditoria ainda.
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const Icon = iconFor(log.entity_type);
              return (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-bg-secondary">
                  <td className="px-4 py-3 text-text-secondary">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3 text-text-primary">{log.user_name}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-text-primary">
                      <Icon size={14} className="text-text-muted" />
                      {ACTION_LABELS[log.action] ?? log.action} · {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{log.details ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          page={logPage.page}
          totalPages={logPage.totalPages}
          total={logPage.total}
          basePath="/auditoria"
          searchParams={{}}
        />
      </div>
    </div>
  );
}
