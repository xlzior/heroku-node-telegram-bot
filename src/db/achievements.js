const { pool, getRows } = require("./postgresql");

const getAll = userId => {
  return pool.query(`SELECT * FROM achievements WHERE user_id=${userId}`).then(getRows);
};

const defaultAchievement = (userId, type) => ({
  user_id: userId,
  type,
  level: 0,
});

const get = async (userId, type) => {
  const res = await pool.query(`SELECT * FROM achievements WHERE user_id=${userId} AND type='${type}'`);
  const rows = getRows(res);
  return rows.length > 0 ? rows : defaultAchievement(userId, type);
};

const update = (userId, type, level) => {
  return pool.query(
    `INSERT INTO achievements(user_id, type, level) VALUES(${userId}, '${type}', ${level})
    ON CONFLICT (user_id, type)
    DO UPDATE SET level=${level} WHERE achievements.user_id=${userId} AND achievements.type='${type}';`);
};

module.exports = {
  getAll,
  get,
  update,
};
