const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const getRows = res => res.rows;
const getFirst = res => res.rows[0];

module.exports = {
  pool,
  getRows,
  getFirst,
};
