const { pool, getRows, getFirst } = require("./postgresql");

const getUser = userId => {
  return pool.query(`SELECT time, questions FROM schedules WHERE user_id=${userId};`).then(getRows);
};

const getNow = () => {
  const now = (new Date()).getHours() * 100;
  return pool.query(`SELECT user_id, questions FROM schedules WHERE time=${now};`).then(getRows);
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
  getNow,
  getQuestions,
  add,
  delete: deleteSchedule,
};
