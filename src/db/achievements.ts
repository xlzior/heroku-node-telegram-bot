import { Achievement } from "../types/entities";
import { pool, getRows } from "./postgresql";

export const getAll = async (chatId: number): Promise<Achievement[]> => {
  const res = await pool.query("SELECT * FROM achievements WHERE user_id=$1", [chatId]);
  return getRows(res);
};

export const defaultAchievement = (chatId: number, type: string): Achievement => ({
  user_id: chatId,
  type,
  level: 0,
});

export const get = async (chatId: number, type: string): Promise<Achievement> => {
  const res = await pool.query(
    "SELECT * FROM achievements WHERE user_id=$1 AND type=$2",
    [chatId, type]);
  const rows = getRows(res);
  return rows.length > 0 ? rows[0] : defaultAchievement(chatId, type);
};

export const update = async (chatId: number, type: string, level: number): Promise<void> => {
  await pool.query(
    `INSERT INTO achievements(user_id, type, level) VALUES($1, $2, $3)
    ON CONFLICT (user_id, type)
    DO UPDATE SET level=$3 WHERE achievements.user_id=$1 AND achievements.type=$2;`,
    [chatId, type, level]);
};
