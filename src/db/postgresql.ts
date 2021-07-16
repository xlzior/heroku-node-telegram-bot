import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const getRows = res => res.rows;
export const getFirst = res => res.rows[0];
