/**
 * Next.js chama register() quando uma instância do servidor sobe. A ideia original
 * era disparar ensureDb() aqui pra rodar as migrações "a cada start do servidor".
 *
 * Isso foi removido de propósito: no Turbopack (principalmente no Windows, em
 * `next dev`), importar o driver `pg` durante o carregamento do hook de
 * instrumentation dispara um bug conhecido do bundler ao resolver o módulo
 * externo `pg`/`pg-types` ("pgTypes.getTypeParser is not a function"), que
 * derruba o servidor de dev inteiro antes mesmo do nosso try/catch rodar.
 *
 * Na prática isso não muda o comportamento pro usuário: ensureDb() já é
 * chamado de forma preguiçosa (e memoizada) em toda query real, dentro de
 * src/infrastructure/db/index.ts. Ou seja, as migrações continuam rodando
 * automaticamente sem nenhum passo manual — só que no primeiro request que
 * efetivamente toca o banco, em vez de no boot do processo. Em produção
 * (Vercel serverless) isso é equivalente na prática, já que cada cold start
 * processa uma request logo em seguida.
 */
export async function register() {}
