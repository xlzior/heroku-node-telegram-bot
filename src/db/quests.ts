import { Quest } from "../types/entities";
import { pool, getRows, getFirst } from "./postgresql";

export const getAll = async (limit: number, offset: number): Promise<Quest[]> => {
  const res = await pool.query("SELECT * FROM quests LIMIT $1 OFFSET $2;", [limit, offset]);
  return getRows(res);
};

export const get = async (questId: number): Promise<Quest> => {
  const res = await pool.query("SELECT name, questions FROM quests WHERE id=$1;", [questId]);
  return getFirst(res);
};

export const getCount = async (): Promise<number> => {
  const res = await pool.query("SELECT COUNT(id) FROM quests;");
  return getFirst(res).count;
};
