import { pool, getRows, getFirst } from "./postgresql";
import { getId } from "./current";

export const getCount = async (chatId: number): Promise<number> => {
  const res = await pool.query("SELECT SUM(count) FROM emojis WHERE user_id=$1", [chatId]);
  return getFirst(res).sum;
};

export const getCurrent = async (chatId: number) => {
  const startId = await getId(chatId);
  const res = await pool.query(
    `SELECT emoji, count FROM emojis
    WHERE user_id=$1 AND start_id=$2
    ORDER BY count DESC;`,
    [chatId, startId]
  );
  return getRows(res);
};

export const getUser = async (
  chatId: number
): Promise<{ emoji: string; count: number; }[]> => {
  const res = await pool.query(
    `SELECT emoji, SUM(count) AS count FROM emojis
    WHERE user_id=$1
    GROUP BY emoji
    ORDER BY count DESC;`,
    [chatId],
  );
  return getRows(res)
    .map(({ emoji, count }) => ({ emoji, count: parseInt(count) }));
};

export const add = async (chatId: number, emojis = []) => {
  if (emojis.length === 0) return;
  const startId = await getId(chatId);
  const promises = emojis.map(({ emoji, count }) => {
    return pool.query(
      `INSERT INTO emojis(user_id, start_id, emoji, count)
      VALUES($1, $2, $3, $4)
      ON CONFLICT (user_id, start_id, emoji)
      DO UPDATE SET count = emojis.count + $4;`,
      [chatId, startId, emoji, count]);
  });
  return Promise.all(promises);
};
