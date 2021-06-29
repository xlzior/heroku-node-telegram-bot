const errors = require("./errors");
const { pool, getFirst } = require("./postgresql");

const getId = async userId => {
  const res = await pool.query(
    "SELECT current_reflection_id FROM users WHERE user_id=$1",
    [userId]);
  return getFirst(res).current_reflection_id;
};

const setId = (userId, start) => {
  return pool.query(
    "UPDATE users SET current_reflection_id=$1 WHERE user_id=$2",
    [start, userId]);
};

const resetId = userId => {
  return setId(userId, null);
};

const get = async userId => {
  const startId = await getId(userId);
  if (!startId) return Promise.reject(errors.NO_CURRENT_REFLECTION);
  return pool.query(
    "SELECT * FROM reflections WHERE user_id=$1 AND start_id=$2",
    [userId, startId])
  .then(getFirst);
};

module.exports = {
  getId,
  setId,
  resetId,
  get,
};
