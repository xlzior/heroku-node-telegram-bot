const current = require("./current");
const { pool, getFirst, getRows } = require("./postgresql");

const getCount = async (userId, hashtag) => {
  const res = await pool.query("SELECT COUNT(hashtag) FROM hashtags WHERE user_id=$1 AND hashtag=$2;", [userId, hashtag]);
  return parseInt(getFirst(res).count);
};

const getTotalCount = async userId => {
  const res = await pool.query("SELECT COUNT(hashtag) FROM hashtags WHERE user_id=$1;", [userId]);
  return parseInt(getFirst(res).count);
};

const getUniqueCount = async userId => {
  const res = await pool.query("SELECT COUNT(DISTINCT hashtag) FROM hashtags WHERE user_id=$1;", [userId]);
  return parseInt(getFirst(res).count);
};

const getAll = async userId => {
  const res = await pool.query(
    `SELECT hashtag, COUNT(hashtag) AS count
    FROM hashtags
    WHERE user_id=$1
    GROUP BY hashtag
    ORDER BY count DESC;`,
    [userId]);
  return getRows(res);
};

const get = async (userId, hashtag, limit, offset) => {
  const res = await pool.query(
    `SELECT name, reflections.start_id
    FROM hashtags
    INNER JOIN reflections ON (hashtags.user_id = reflections.user_id AND hashtags.start_id = reflections.start_id)
    WHERE hashtags.user_id=$1 AND hashtag=$2
    GROUP BY hashtag, name, reflections.start_id
    ORDER BY COUNT(hashtags.start_id) DESC
    LIMIT $3 OFFSET $4;`,
    [userId, hashtag, limit, offset]);
  return getRows(res);
};

const add = async (userId, hashtags = []) => {
  if (hashtags.length === 0) return;
  const startId = await current.getId(userId);
  const promises = hashtags.map(hashtag => {
    return pool.query(
      `INSERT INTO hashtags(user_id, start_id, hashtag) VALUES($1, $2, $3)
      ON CONFLICT DO NOTHING;`,
      [userId, startId, hashtag]);
  });
  return Promise.all(promises);
};

module.exports = {
  getCount,
  getTotalCount,
  getUniqueCount,
  getAll,
  get,
  add,
};
