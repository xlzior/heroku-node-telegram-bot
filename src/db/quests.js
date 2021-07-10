const { pool, getFirst, getRows } = require("./postgresql");

const getAll = async (limit, offset) => {
  const res = await pool.query("SELECT * FROM quests LIMIT $1 OFFSET $2;", [limit, offset]);
  return getRows(res);
};

const get = async questId => {
  const res = await pool.query("SELECT name, questions FROM quests WHERE id=$1;", [questId]);
  return getFirst(res);
};

const getCount = async () => {
  const res = await pool.query("SELECT COUNT(id) FROM quests;");
  return getFirst(res).count;
};

module.exports = {
  getAll,
  get,
  getCount,
};
