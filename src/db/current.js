const { pool, getFirst } = require("./postgresql");

const getId = async (userId) => {
  const res = await pool.query(`SELECT current_reflection_id FROM users WHERE user_id=${userId}`);
  const reflectionId = getFirst(res).current_reflection_id;
  if (reflectionId) return reflectionId;
  return Promise.reject("NO_CURRENT_REFLECTION");

  // TODO: reject with an error code, shift the message into bot's catch
};

const setId = (userId, start) => {
  return pool.query(`UPDATE users SET current_reflection_id=${start} WHERE user_id=${userId}`);
};

const resetId = (userId) => {
  return setId(userId, 'NULL');
};

const get = async (userId) => {
  const startId = await getId(userId);
  return pool.query(`SELECT * FROM reflections WHERE user_id=${userId} AND start_id=${startId}`).then(getFirst);
};

module.exports = {
  getId,
  setId,
  resetId,
  get,
};