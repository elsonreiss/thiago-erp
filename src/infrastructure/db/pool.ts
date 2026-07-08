import { Pool, types } from "pg";

// Por padrão o pg converte colunas DATE/TIMESTAMP/TIMESTAMPTZ em objetos Date do JS.
// O resto do app assume que datas trafegam como string (formato ISO / "YYYY-MM-DD"),
// então sobrescrevemos os parsers pra devolver o valor bruto do banco sem conversão.
const OID_DATE = 1082;
const OID_TIMESTAMP = 1114;
const OID_TIMESTAMPTZ = 1184;

types.setTypeParser(OID_DATE, (value: string) => value);
types.setTypeParser(OID_TIMESTAMP, (value: string) => value);
types.setTypeParser(OID_TIMESTAMPTZ, (value: string) => value);

declare global {
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Crie um .env.local na raiz do projeto com a connection string do Neon."
    );
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

/**
 * Criação preguiçosa (lazy) de propósito: se o Pool fosse criado no escopo do
 * módulo (top-level), o Next.js tentaria instanciá-lo durante a etapa de build
 * "Collecting page data" — que roda mesmo sem DATABASE_URL disponível (ex: build
 * local sem .env.local ainda configurado) — e derrubaria o build inteiro.
 * Criando só na primeira query real, o build nunca toca o banco.
 */
export function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = createPool();
    global.__pgPool.on("error", (err) => {
      console.error("Erro inesperado no pool de conexões do Postgres:", err);
    });
  }
  return global.__pgPool;
}
