import { pool, getRows, getFirst } from "./postgresql";

export const getAll = async (limit: number, offset: number) => {
  const res = await pool.query("SELECT * FROM quests LIMIT $1 OFFSET $2;", [limit, offset]);
  return getRows(res);
};

export const get = async (questId: number) => {
  const res = await pool.query("SELECT name, questions FROM quests WHERE id=$1;", [questId]);
  return getFirst(res);
};

export const getCount = async () => {
  const res = await pool.query("SELECT COUNT(id) FROM quests;");
  return getFirst(res).count;
};
