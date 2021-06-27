const { pool, getRows, getFirst } = require("./postgresql");

const getUser = userId => {
  return pool.query(`SELECT time, questions FROM schedules WHERE user_id=${userId} ORDER BY time;`).then(getRows);
};

const getTime = time => {
  return pool.query(`SELECT user_id, questions FROM schedules WHERE time=${time};`).then(getRows);
};

const getQuestions = async (userId, time) => {
  const res = await pool.query(`SELECT questions FROM schedules WHERE user_id=${userId} AND time=${time};`);
  return getFirst(res) ? getFirst(res).questions : [];
};

const add = (userId, time, questions) => {
  const questionsArray = `{${questions.map(qn => `"${qn}"`).join(",")}}`;
  return pool.query(
    `INSERT INTO schedules(user_id, time, questions)
    VALUES(${userId}, ${time}, '${questionsArray}');`);
};

const deleteSchedule = (userId, time) => {
  return pool.query(`DELETE FROM schedules WHERE user_id=${userId} AND time=${time};`);
};

module.exports = {
  getUser,
  getTime,
  getQuestions,
  add,
  delete: deleteSchedule,
};
