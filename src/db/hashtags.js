const current = require('./current');
const { pool, getFirst, getRows } = require("./postgresql");

const getCount = async (userId) => {
  return pool.query(`SELECT COUNT(*) FROM hashtags WHERE user_id=${userId}`).then(getFirst);
}

const get = async (userId) => {
  const hashtags = await pool.query(
    `SELECT hashtag, json_agg(json_build_array(hashtags.start_id, name) ORDER BY hashtags.start_id) AS messages
    FROM hashtags
    INNER JOIN reflections
    ON (hashtags.start_id = reflections.start_id)
    WHERE hashtags.user_id=${userId}
    GROUP BY hashtag;`).then(getRows);
  if (hashtags.length === 0) return Promise.reject("You have no hashtags saved. /open a conversation and use hashtags to categorise your entries.")

  return hashtags;
}

const add = async (userId, hashtags = []) => {
  if (hashtags.length === 0) return;
  const startId = await current.getId(userId);
  const promises = hashtags.map(hashtag => {
    return pool.query(`INSERT INTO hashtags(user_id, start_id, hashtag) VALUES(${userId}, ${startId}, '${hashtag}');`);
  });
  try {
    await Promise.all(promises);
  } catch (e) {
    console.info(e);
  }
}

module.exports = {
  getCount,
  get,
  add,
}