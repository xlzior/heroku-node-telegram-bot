import { Pool, QueryResult } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const getRows = (res: QueryResult<any>) => res.rows;
export const getFirst = (res: QueryResult<any>) => res.rows[0];
