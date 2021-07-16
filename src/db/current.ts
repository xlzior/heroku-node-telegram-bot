import { pool, getFirst } from "./postgresql";
import { NO_CURRENT_REFLECTION } from "./errors";

export const getId = async (chatId: number): Promise<number> => {
  const res = await pool.query(
    "SELECT current_reflection_id FROM users WHERE user_id=$1",
    [chatId]);
  if (res.rows.length > 0) return getFirst(res).current_reflection_id;
  return null;
};

export const setId = (chatId: number, start: number) => {
  return pool.query(
    "UPDATE users SET current_reflection_id=$1 WHERE user_id=$2",
    [start, chatId]);
};

export const resetId = (chatId: number) => {
  return setId(chatId, null);
};

export const get = async (chatId: number) => {
  const startId = await getId(chatId);
  if (!startId) return Promise.reject(NO_CURRENT_REFLECTION);
  const res = await pool.query(
    "SELECT * FROM reflections WHERE user_id=$1 AND start_id=$2",
    [chatId, startId]);

  return getFirst(res);
};
