const current = require("./current");
const { pool, getFirst, getRows } = require("./postgresql");

const getTotalCount = async userId => {
  const res = await pool.query(`SELECT COUNT(hashtag) FROM hashtags WHERE user_id=${userId}`);
  return parseInt(getFirst(res).count);
};

const getUniqueCount = async userId => {
  const res = await pool.query(`SELECT COUNT(DISTINCT hashtag) FROM hashtags WHERE user_id=${userId}`);
  return parseInt(getFirst(res).count);
};

const getAll = userId => {
  return pool.query(
    `SELECT
      hashtag,
      json_agg(json_build_array(hashtags.start_id, name) ORDER BY hashtags.start_id DESC) AS messages
    FROM hashtags
    INNER JOIN reflections ON (hashtags.user_id = reflections.user_id AND hashtags.start_id = reflections.start_id)
    WHERE hashtags.user_id=${userId}
    GROUP BY hashtag
    ORDER BY COUNT(hashtags.start_id) DESC;`).then(getRows);
};

const get = async (userId, hashtag) => {
  const res = await pool.query(
    `SELECT
      hashtag,
      json_agg(json_build_array(hashtags.start_id, name) ORDER BY hashtags.start_id DESC) AS messages
    FROM hashtags
    INNER JOIN reflections ON (hashtags.user_id = reflections.user_id AND hashtags.start_id = reflections.start_id)
    WHERE hashtags.user_id=${userId} AND hashtag='${hashtag}'
    GROUP BY hashtag
    ORDER BY COUNT(hashtags.start_id) DESC;`);
  const rows = getRows(res);
  return rows.length > 0 ? rows[0] : null;
};

const add = async (userId, hashtags = []) => {
  if (hashtags.length === 0) return;
  const startId = await current.getId(userId);
  const promises = hashtags.map(hashtag => {
    return pool.query(
      `INSERT INTO hashtags(user_id, start_id, hashtag)
      VALUES(${userId}, ${startId}, '${hashtag}')
      ON CONFLICT DO NOTHING;`);
  });
  return Promise.all(promises);
};

module.exports = {
  getTotalCount,
  getUniqueCount,
  getAll,
  get,
  add,
};
