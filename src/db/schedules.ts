import { Schedule, ScheduleQuestions } from "../types/entities";
import { pool, getRows, getFirst } from "./postgresql";

export const getUser = async (chatId: number): Promise<Schedule[]> => {
  const res = await pool.query("SELECT time, questions FROM schedules WHERE user_id=$1;", [chatId]);
  return getRows(res);
};

type UserSchedule = {
  user_id: number,
  questions: string[],
}

export const getTime = async (time: string): Promise<UserSchedule[]> => {
  const res = await pool.query("SELECT user_id, questions FROM schedules WHERE time=$1;", [time]);
  return getRows(res);
};

export const getQuestions = async (chatId: number, time: string): Promise<ScheduleQuestions> => {
  const res = await pool.query("SELECT questions FROM schedules WHERE user_id=$1 AND time=$2;", [chatId, time]);
  return getFirst(res) ? getFirst(res).questions : [];
};

export const add = async (
  chatId: number,
  time: string,
  questions: string[]
): Promise<void> => {
  await pool.query(
    "INSERT INTO schedules(user_id, time, questions) VALUES($1, $2, $3);",
    [chatId, time, questions]);
};

export const edit = async (
  chatId: number,
  time: string,
  newTime: string,
  newQuestions: string[]
): Promise<void> => {
  await pool.query(
    `UPDATE schedules
    SET time=$1, questions=$2
    WHERE user_id=$3 AND time=$4;`,
    [newTime, newQuestions, chatId, time]);
};

const deleteSchedule = async (chatId: number, time: string): Promise<void> => {
  await pool.query("DELETE FROM schedules WHERE user_id=$1 AND time=$2;", [chatId, time]);
};

export { deleteSchedule as delete };
