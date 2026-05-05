import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __menuCupPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  return new Pool({
    connectionString,
    ssl:
      process.env.DATABASE_SSL === "disable"
        ? false
        : { rejectUnauthorized: false },
  });
}

function getPool() {
  if (globalThis.__menuCupPool) {
    return globalThis.__menuCupPool;
  }

  const nextPool = createPool();
  if (!nextPool) {
    throw new Error("DATABASE_URL is not set");
  }

  if (process.env.NODE_ENV !== "production") {
    globalThis.__menuCupPool = nextPool;
  }

  return nextPool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    return Reflect.get(getPool(), prop, receiver);
  },
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
