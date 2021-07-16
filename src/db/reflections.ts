import { pool, getRows, getFirst } from "./postgresql";
import * as current from "./current";
import { REFLECTION_ALREADY_OPEN, NO_REFLECTION_OPEN } from "./errors";

export const getCount = async (chatId: number) => {
  const res = await pool.query("SELECT COUNT(*) FROM reflections WHERE user_id=$1", [chatId]);
  return parseInt(getFirst(res).count);
};

export const getLengths = async (chatId: number) => {
  const res = await pool.query("SELECT length FROM reflections WHERE user_id=$1", [chatId]);
  return getRows(res).map(({ length }) => length);
};

export const get = async (chatId: number, limit: number, offset: number) => {
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

export const getAll = async (chatId: number) => {
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

const insert = (chatId: number, start: number) => {
  return pool.query(
    "INSERT INTO reflections(user_id, start_id, name, length) VALUES($1, $2, 'Reflection in progress', 0)",
    [chatId, start]);
};

const update = async (chatId: number, start: number, end: number, name: string) => {
  const res = await pool.query(
    `UPDATE reflections SET end_id=$1, name=$2
    WHERE user_id=$3 AND start_id=$4
    RETURNING length`,
    [end, name, chatId, start]);
  return getFirst(res).length;
};

const deleteReflection = (chatId: number, start: number) => {
  return pool.query("DELETE FROM reflections WHERE user_id=$1 AND start_id=$2;", [chatId, start]);
};

export const isOpen = (chatId: number) => {
  return current.getId(chatId).then(Boolean);
};

export const open = async (chatId: number, start: number) => {
  const reflectionId = await current.getId(chatId);
  if (reflectionId) return Promise.reject(REFLECTION_ALREADY_OPEN);

  await insert(chatId, start);
  await current.setId(chatId, start);
};

export const incrementLength = (chatId: number, start: number) => {
  return pool.query(
    "UPDATE reflections SET length=length+1 WHERE user_id=$1 AND start_id=$2",
    [chatId, start]);
};

export const close = async (chatId: number, end: number, name: string) => {
  const start = await current.getId(chatId);

  if (!start) return Promise.reject(NO_REFLECTION_OPEN);

  current.resetId(chatId);
  const length = await update(chatId, start, end, name);
  return length;
};

export const cancel = async (chatId: number) => {
  const start = await current.getId(chatId);

  if (!start) return Promise.reject(NO_REFLECTION_OPEN);

  deleteReflection(chatId, start);
  current.resetId(chatId);
};

export { current };