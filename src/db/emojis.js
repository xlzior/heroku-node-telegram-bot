const current = require("./current");
const { pool, getRows, getFirst } = require("./postgresql");

const getCount = async userId => {
  const res = await pool.query(`SELECT COUNT(*) FROM emojis WHERE user_id=${userId}`);
  return getFirst(res).count;
};

const getCurrent = async userId => {
  const startId = await current.getId(userId);
  return pool.query(
    `SELECT emoji, count FROM emojis
    WHERE user_id=${userId} AND start_id=${startId}
    ORDER BY count DESC;`
  ).then(getRows);
};

const add = async (userId, emojis = []) => {
  if (emojis.length === 0) return;
  const startId = await current.getId(userId);
  const promises = emojis.map(({ emoji, count }) => {
    return pool.query(
      `INSERT INTO emojis(user_id, start_id, emoji, count)
      VALUES(${userId}, ${startId}, '${emoji}', ${count})
      ON CONFLICT (user_id, start_id, emoji)
      DO UPDATE SET count = emojis.count + ${count};`);
  });
  return Promise.all(promises);
};

module.exports = {
  getCurrent, getCount,
  add,
};
