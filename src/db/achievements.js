const { pool, getRows } = require("./postgresql");

const get = (userId) => {
  return pool.query(`SELECT * FROM achievements WHERE user_id=${userId}`).then(getRows);
}

const update = (userId, type, level) => {
  return pool.query(
    `INSERT INTO achievements(user_id, type, level) VALUES(${userId}, '${type}', ${level})
    ON CONFLICT (user_id, type)
    DO UPDATE SET level=${level} WHERE achievements.user_id=${userId} AND achievements.type='${type}';`);
}

module.exports = {
  get,
  update,
}