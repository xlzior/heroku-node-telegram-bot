const db = require('./index.js');
const { pool, getFirst, getRows } = require("./postgresql");

const getCount = async (userId) => {
  return pool.query(`SELECT COUNT(*) FROM hashtags WHERE user_id=${userId}`).then(getFirst);
}

const get = async (userId) => {
  const rawHashtags = pool.query(`SELECT * FROM hashtags WHERE user_id=${userId}`).then(getRows);
  console.log('rawHashtags :', rawHashtags);
  return rawHashtags;
  // TODO: post-process the rows a bit? convert to an array of objects with hashtag and messages
  // TODO: reject if there are no hashtags
  // TODO: might need to join table with reflections to get reflection name...
}

const add = async (userId, hashtags = []) => {
  if (hashtags.length === 0) return;

  const startId = await db.reflections.current.getId(userId);
  const promises = hashtags.map(hashtag => {
    return pool.query(`INSERT INTO hashtags(user_id, start_id, hashtag) VALUES(${userId}, ${startId}, ${hashtag});`);
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