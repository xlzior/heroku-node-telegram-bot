import current = require("./current");
import postgresql = require("./postgresql");

const { pool, getFirst, getRows } = postgresql;

export const getCount = async (chatId, hashtag) => {
  const res = await pool.query("SELECT COUNT(hashtag) FROM hashtags WHERE user_id=$1 AND hashtag=$2;", [chatId, hashtag]);
  return parseInt(getFirst(res).count);
};

export const getTotalCount = async chatId => {
  const res = await pool.query("SELECT COUNT(hashtag) FROM hashtags WHERE user_id=$1;", [chatId]);
  return parseInt(getFirst(res).count);
};

export const getUniqueCount = async chatId => {
  const res = await pool.query("SELECT COUNT(DISTINCT hashtag) FROM hashtags WHERE user_id=$1;", [chatId]);
  return parseInt(getFirst(res).count);
};

export const getAll = async (chatId, limit, offset) => {
  const res = await pool.query(
    `SELECT hashtag, COUNT(hashtag) AS count
    FROM hashtags
    WHERE user_id=$1
    GROUP BY hashtag
    ORDER BY count DESC, hashtag ASC
    LIMIT $2 OFFSET $3;`,
    [chatId, limit, offset]);
  return getRows(res);
};

export const get = async (chatId, hashtag, limit, offset) => {
  const res = await pool.query(
    `SELECT name, reflections.start_id
    FROM hashtags
    INNER JOIN reflections ON (hashtags.user_id = reflections.user_id AND hashtags.start_id = reflections.start_id)
    WHERE hashtags.user_id=$1 AND hashtag=$2
    GROUP BY hashtag, name, reflections.start_id
    ORDER BY reflections.start_id DESC
    LIMIT $3 OFFSET $4;`,
    [chatId, hashtag, limit, offset]);
  return getRows(res);
};

export const add = async (chatId, hashtags = []) => {
  if (hashtags.length === 0) return;
  const startId = await current.getId(chatId);
  const promises = hashtags.map(hashtag => {
    return pool.query(
      `INSERT INTO hashtags(user_id, start_id, hashtag) VALUES($1, $2, $3)
      ON CONFLICT DO NOTHING;`,
      [chatId, startId, hashtag]);
  });
  return Promise.all(promises);
};
