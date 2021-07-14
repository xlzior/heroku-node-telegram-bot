import errors = require("./errors");
import postgresql = require("./postgresql");

const { pool, getFirst } = postgresql;

export const getId = async chatId => {
  const res = await pool.query(
    "SELECT current_reflection_id FROM users WHERE user_id=$1",
    [chatId]);
  if (res.rows.length > 0) return getFirst(res).current_reflection_id;
  return null;
};

export const setId = (chatId, start) => {
  return pool.query(
    "UPDATE users SET current_reflection_id=$1 WHERE user_id=$2",
    [start, chatId]);
};

export const resetId = chatId => {
  return setId(chatId, null);
};

export const get = async chatId => {
  const startId = await getId(chatId);
  if (!startId) return Promise.reject(errors.NO_CURRENT_REFLECTION);
  return pool.query(
    "SELECT * FROM reflections WHERE user_id=$1 AND start_id=$2",
    [chatId, startId])
  .then(getFirst);
};
