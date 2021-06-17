const { pool, getRows } = require("./postgresql");

const get = (userId) => {
  return pool.query(`SELECT * FROM achievements WHERE user_id=${userId}`).then(getRows);
}

const update = (userId, type, level) => {
  return pool.query(`UPDATE achievements SET level=${level} WHERE user_id=${userId} AND type='${type}'`);
}

module.exports = {
  get,
  update,
}