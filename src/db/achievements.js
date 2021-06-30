const { pool, getRows } = require("./postgresql");

const getAll = chatId => {
  return pool.query("SELECT * FROM achievements WHERE user_id=$1", [chatId]).then(getRows);
};

const defaultAchievement = (chatId, type) => ({
  user_id: chatId,
  type,
  level: 0,
});

const get = async (chatId, type) => {
  const res = await pool.query(
    "SELECT * FROM achievements WHERE user_id=$1 AND type=$2",
    [chatId, type]);
  const rows = getRows(res);
  return rows.length > 0 ? rows[0] : defaultAchievement(chatId, type);
};

const update = (chatId, type, level) => {
  return pool.query(
    `INSERT INTO achievements(user_id, type, level) VALUES($1, $2, $3)
    ON CONFLICT (user_id, type)
    DO UPDATE SET level=$3 WHERE achievements.user_id=$1 AND achievements.type=$2;`,
    [chatId, type, level]);
};

module.exports = {
  getAll,
  get,
  update,
};
