import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { container } from "@/container";
import { companyDisplayName } from "@/domain/entities/CompanySettings";

export default async function PrivacidadePage() {
  await requireAdmin();
  const settings = await container.companySettingsRepository.get();
  const name = companyDisplayName(settings);
  const cnpj = settings.cnpj;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/configuracoes"
          className="rounded-lg p-2 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Privacidade e proteção de dados</h1>
          <p className="text-sm text-text-secondary">Referência interna sobre tratamento de dados pessoais (LGPD).</p>
        </div>
      </div>

      <div className="price-tag-card flex flex-col gap-5 rounded-xl p-6 text-sm text-text-secondary">
        <p className="text-xs text-text-muted">
          Este texto é um modelo de referência, editável pelo administrador diretamente no código do sistema
          (não substitui orientação jurídica). Revise com um advogado ou contador antes de usar oficialmente com
          clientes.
        </p>

        <section>
          <h2 className="mb-1.5 font-display text-base font-semibold text-text-primary">1. Quem trata os dados</h2>
          <p>
            {name}
            {cnpj ? `, CNPJ ${cnpj},` : ""} utiliza este sistema interno de gestão para registrar vendas, compras,
            orçamentos e controle de fiado. Os dados pessoais tratados aqui são de clientes, fornecedores e
            colaboradores da própria loja.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-display text-base font-semibold text-text-primary">2. Quais dados são coletados</h2>
          <p>
            Nome, CPF/CNPJ, telefone, WhatsApp, e-mail e endereço de clientes e fornecedores; histórico de compras,
            orçamentos e pagamentos (inclusive fiado); e, para os usuários do sistema (funcionários), nome, e-mail e
            registro de ações realizadas (log de auditoria).
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-display text-base font-semibold text-text-primary">3. Finalidade</h2>
          <p>
            Os dados são usados exclusivamente para viabilizar a relação comercial: emitir comprovantes internos,
            controlar vendas fiado, entrar em contato sobre pedidos/pagamentos via WhatsApp, e cumprir obrigações
            legais e contábeis do negócio. Não há venda ou compartilhamento de dados com terceiros para fins de
            marketing.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-display text-base font-semibold text-text-primary">4. Onde ficam armazenados</h2>
          <p>
            Os dados ficam armazenados em banco de dados gerenciado (Postgres/Neon), protegido por senha e acesso
            restrito aos usuários autorizados do sistema. O acesso ao sistema exige login, e ações sensíveis ficam
            registradas no log de auditoria.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-display text-base font-semibold text-text-primary">5. Direitos do titular</h2>
          <p>
            Qualquer cliente ou fornecedor pode solicitar a confirmação, correção ou exclusão dos seus dados
            cadastrados, entrando em contato diretamente com a loja. Pedidos de exclusão podem ser atendidos
            removendo o cadastro do sistema, exceto quando a manutenção do histórico for exigida por obrigação
            legal/fiscal (ex: registros já vinculados a vendas ou notas emitidas).
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 font-display text-base font-semibold text-text-primary">6. Nota sobre nota fiscal</h2>
          <p>
            Este sistema não emite nota fiscal eletrônica (NF-e/NFC-e) — os comprovantes impressos por aqui são
            documentos internos, sem valor fiscal. A emissão fiscal é feita em sistema próprio para isso.
          </p>
        </section>
      </div>
    </div>
  );
}
