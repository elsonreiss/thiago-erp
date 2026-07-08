/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "pg" {
  export interface QueryResultRow {
    [column: string]: any;
  }

  export interface QueryResult<R extends QueryResultRow = any> {
    rows: R[];
    rowCount: number | null;
    command: string;
    fields: Array<{ name: string; dataTypeID: number }>;
  }

  export interface QueryConfig {
    text: string;
    values?: any[];
  }

  export type QueryResultCallback<R extends QueryResultRow = any> = (
    err: Error | undefined,
    result: QueryResult<R>
  ) => void;

  export class PoolClient {
    query<R extends QueryResultRow = any>(
      queryText: string,
      values?: any[]
    ): Promise<QueryResult<R>>;
    query<R extends QueryResultRow = any>(
      queryConfig: QueryConfig
    ): Promise<QueryResult<R>>;
    release(err?: Error | boolean): void;
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<R extends QueryResultRow = any>(
      queryText: string,
      values?: any[]
    ): Promise<QueryResult<R>>;
    query<R extends QueryResultRow = any>(
      queryConfig: QueryConfig
    ): Promise<QueryResult<R>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "connect", listener: (client: PoolClient) => void): this;
  }

  export interface TypeParsers {
    setTypeParser(oid: number, parser: (value: string) => any): void;
    setTypeParser(
      oid: number,
      format: "text" | "binary",
      parser: (value: string) => any
    ): void;
  }

  export const types: TypeParsers;

  const pg: {
    Pool: typeof Pool;
    types: TypeParsers;
  };

  export default pg;
}
