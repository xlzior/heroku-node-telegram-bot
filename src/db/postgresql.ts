import { Pool, QueryResult } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export function getRows<R>(res: QueryResult<R>): R[] {
  return res.rows;
}

export function getFirst<R>(res: QueryResult<R>): R {
  return res.rows[0];
}
