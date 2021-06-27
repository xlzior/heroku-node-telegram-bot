const { pool, getFirst, getRows } = require("./postgresql");

const current = require("./current");
const errors = require("./errors");

const getCount = async userId => {
  const res = await pool.query(`SELECT COUNT(*) FROM reflections WHERE user_id=${userId}`);
  return parseInt(getFirst(res).count);
};

const getLengths = async userId => {
  const res = await pool.query(`SELECT start_id, end_id FROM reflections WHERE user_id=${userId}`);
  return getRows(res).map(({ start_id, end_id }) => end_id - start_id + 1);
};

const get = async (userId, limit, offset) => {
  const res = await pool.query(
    `SELECT
      reflections.start_id,
      name,
      json_agg(hashtags.hashtag) AS hashtags
    FROM reflections
    LEFT JOIN hashtags ON (reflections.user_id = hashtags.user_id AND reflections.start_id = hashtags.start_id)
    WHERE reflections.user_id=${userId}
    GROUP BY reflections.start_id, reflections.name
    ORDER BY reflections.start_id DESC
    LIMIT ${limit} OFFSET ${offset};`);
  return getRows(res);
};

const getAll = async userId => {
  const res = await pool.query(
    `SELECT
      reflections.start_id,
      name,
      json_agg(hashtags.hashtag) AS hashtags
    FROM reflections
    INNER JOIN hashtags ON (reflections.user_id = hashtags.user_id AND reflections.start_id = hashtags.start_id)
    WHERE reflections.user_id=${userId}
    GROUP BY reflections.start_id, reflections.name
    ORDER BY reflections.start_id DESC;`);
  return getRows(res);
};

const insert = (userId, start) => {
  return pool.query(`INSERT INTO reflections(user_id, start_id) VALUES(${userId}, ${start})`);
};

const update = (userId, start, end, name) => {
  return pool.query(`UPDATE reflections SET end_id='${end}', name='${name}' WHERE user_id=${userId} AND start_id=${start}`);
};

const isOpen = userId => {
  return current.getId(userId).then(Boolean);
};

const open = async (userId, start) => {
  const reflectionId = await current.getId(userId);
  if (reflectionId) return Promise.reject(errors.REFLECTION_ALREADY_OPEN);

  insert(userId, start);
  current.setId(userId, start);
};

const close = async (userId, end, name) => {
  const start = await current.getId(userId);

  if (!start) return Promise.reject(errors.NO_REFLECTION_OPEN);

  update(userId, start, end, name);
  current.resetId(userId);

  return end - start + 1;
};

module.exports = {
  current,
  getCount, getLengths,
  get, getAll,
  isOpen, open, close,
};
