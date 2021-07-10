const errors = require("./errors");
const { pool, getFirst } = require("./postgresql");

const getId = async chatId => {
  const res = await pool.query(
    "SELECT current_reflection_id FROM users WHERE user_id=$1",
    [chatId]);
  if (res.length > 0) return getFirst(res).current_reflection_id;
  return null;
};

const setId = (chatId, start) => {
  return pool.query(
    "UPDATE users SET current_reflection_id=$1 WHERE user_id=$2",
    [start, chatId]);
};

const resetId = chatId => {
  return setId(chatId, null);
};

const get = async chatId => {
  const startId = await getId(chatId);
  if (!startId) return Promise.reject(errors.NO_CURRENT_REFLECTION);
  return pool.query(
    "SELECT * FROM reflections WHERE user_id=$1 AND start_id=$2",
    [chatId, startId])
  .then(getFirst);
};

module.exports = {
  getId,
  setId,
  resetId,
  get,
};
