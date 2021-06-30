const current = require("./current");
const { pool, getRows, getFirst } = require("./postgresql");

const getCount = async chatId => {
  const res = await pool.query("SELECT COUNT(*) FROM emojis WHERE user_id=$1", [chatId]);
  return getFirst(res).count;
};

const getCurrent = async chatId => {
  const startId = await current.getId(chatId);
  return pool.query(
    `SELECT emoji, count FROM emojis
    WHERE user_id=$1 AND start_id=$2
    ORDER BY count DESC;`,
    [chatId, startId]
  ).then(getRows);
};

const add = async (chatId, emojis = []) => {
  if (emojis.length === 0) return;
  const startId = await current.getId(chatId);
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

module.exports = {
  getCurrent, getCount,
  add,
};
