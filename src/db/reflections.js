const { pool, getFirst, getRows } = require("./postgresql");

const current = require("./current");
const errors = require("./errors");

const getCount = async chatId => {
  const res = await pool.query("SELECT COUNT(*) FROM reflections WHERE user_id=$1", [chatId]);
  return parseInt(getFirst(res).count);
};

const getLengths = async chatId => {
  const res = await pool.query("SELECT length FROM reflections WHERE user_id=$1", [chatId]);
  return getRows(res).map(({ length }) => length);
};

const get = async (chatId, limit, offset) => {
  const res = await pool.query(
    `SELECT
      reflections.start_id,
      name,
      json_agg(hashtags.hashtag) AS hashtags
    FROM reflections
    LEFT JOIN hashtags ON (reflections.user_id = hashtags.user_id AND reflections.start_id = hashtags.start_id)
    WHERE reflections.user_id=$1
    GROUP BY reflections.start_id, reflections.name
    ORDER BY reflections.start_id DESC
    LIMIT $2 OFFSET $3;`,
    [chatId, limit, offset]);
  return getRows(res);
};

const getAll = async chatId => {
  const res = await pool.query(
    `SELECT
      reflections.start_id,
      name,
      json_agg(hashtags.hashtag) AS hashtags
    FROM reflections
    INNER JOIN hashtags ON (reflections.user_id = hashtags.user_id AND reflections.start_id = hashtags.start_id)
    WHERE reflections.user_id=$1
    GROUP BY reflections.start_id, reflections.name
    ORDER BY reflections.start_id DESC;`,
    [chatId]);
  return getRows(res);
};

const insert = (chatId, start) => {
  return pool.query(
    "INSERT INTO reflections(user_id, start_id, name, length) VALUES($1, $2, 'Reflection in progress', 0)",
    [chatId, start]);
};

const update = async (chatId, start, end, name) => {
  const res = await pool.query(
    `UPDATE reflections SET end_id=$1, name=$2
    WHERE user_id=$3 AND start_id=$4
    RETURNING length`,
    [end, name, chatId, start]);
  return getFirst(res).length;
};

const deleteReflection = (chatId, start) => {
  return pool.query("DELETE FROM reflections WHERE user_id=$1 AND start_id=$2;", [chatId, start]);
};

const isOpen = chatId => {
  return current.getId(chatId).then(Boolean);
};

const open = async (chatId, start) => {
  const reflectionId = await current.getId(chatId);
  if (reflectionId) return Promise.reject(errors.REFLECTION_ALREADY_OPEN);

  await insert(chatId, start);
  await current.setId(chatId, start);
};

const incrementLength = (chatId, start) => {
  return pool.query(
    "UPDATE reflections SET length=length+1 WHERE user_id=$1 AND start_id=$2",
    [chatId, start]);
};

const close = async (chatId, end, name) => {
  const start = await current.getId(chatId);

  if (!start) return Promise.reject(errors.NO_REFLECTION_OPEN);

  current.resetId(chatId);
  const length = await update(chatId, start, end, name);
  return length;
};

const cancel = async chatId => {
  const start = await current.getId(chatId);

  if (!start) return Promise.reject(errors.NO_REFLECTION_OPEN);

  deleteReflection(chatId, start);
  current.resetId(chatId);
};

module.exports = {
  current,
  getCount, getLengths,
  get, getAll,
  isOpen, open, incrementLength, close, cancel,
};
