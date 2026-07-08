import { PoolClient, QueryResultRow } from "pg";
import { getPool } from "@/infrastructure/db/pool";
import { ensureDb } from "@/infrastructure/db/ensureDb";

/**
 * Helper central de acesso ao banco. Toda query do app passa por aqui (direto ou
 * via os repositórios), o que garante que ensureDb() já rodou antes de qualquer
 * SELECT/INSERT tocar o banco — inclusive como rede de segurança caso o hook de
 * instrumentation não tenha disparado a tempo em algum cold start serverless.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<{ rows: R[]; rowCount: number | null }> {
  await ensureDb();
  return getPool().query<R>(text, params);
}

/** Pra transações: BEGIN/COMMIT/ROLLBACK manuais em cima de um único client. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  await ensureDb();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
