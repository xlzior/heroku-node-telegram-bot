import { pool, getRows, getFirst } from "./postgresql";

export const getUser = chatId => {
  return pool.query("SELECT time, questions FROM schedules WHERE user_id=$1;", [chatId])
  .then(getRows);
};

export const getTime = time => {
  return pool.query("SELECT user_id, questions FROM schedules WHERE time=$1;", [time]).then(getRows);
};

export const getQuestions = async (chatId, time) => {
  const res = await pool.query("SELECT questions FROM schedules WHERE user_id=$1 AND time=$2;", [chatId, time]);
  return getFirst(res) ? getFirst(res).questions : [];
};

export const add = (chatId, time, questions) => {
  return pool.query(
    "INSERT INTO schedules(user_id, time, questions) VALUES($1, $2, $3);",
    [chatId, time, questions]);
};

export const edit = (chatId, time, newTime, newQuestions) => {
  return pool.query(
    `UPDATE schedules
    SET time=$1, questions=$2
    WHERE user_id=$3 AND time=$4;`,
    [newTime, newQuestions, chatId, time]);
};

const deleteSchedule = (chatId, time) => {
  return pool.query("DELETE FROM schedules WHERE user_id=$1 AND time=$2;", [chatId, time]);
};

export { deleteSchedule as delete };