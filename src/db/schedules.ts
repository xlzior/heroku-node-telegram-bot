import { pool, getRows, getFirst } from "./postgresql";

export const getUser = (chatId: number) => {
  return pool.query("SELECT time, questions FROM schedules WHERE user_id=$1;", [chatId])
  .then(getRows);
};

export const getTime = (time: string) => {
  return pool.query("SELECT user_id, questions FROM schedules WHERE time=$1;", [time]).then(getRows);
};

export const getQuestions = async (chatId: number, time: string) => {
  const res = await pool.query("SELECT questions FROM schedules WHERE user_id=$1 AND time=$2;", [chatId, time]);
  return getFirst(res) ? getFirst(res).questions : [];
};

export const add = (chatId: number, time: string, questions: string[]) => {
  return pool.query(
    "INSERT INTO schedules(user_id, time, questions) VALUES($1, $2, $3);",
    [chatId, time, questions]);
};

export const edit = (chatId: number, time: string, newTime: string, newQuestions: string[]) => {
  return pool.query(
    `UPDATE schedules
    SET time=$1, questions=$2
    WHERE user_id=$3 AND time=$4;`,
    [newTime, newQuestions, chatId, time]);
};

const deleteSchedule = (chatId: number, time: string) => {
  return pool.query("DELETE FROM schedules WHERE user_id=$1 AND time=$2;", [chatId, time]);
};

export { deleteSchedule as delete };