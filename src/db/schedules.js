const { pool, getRows, getFirst } = require("./postgresql");

const getUser = userId => {
  return pool.query(`SELECT time, questions FROM schedules WHERE user_id=${userId} ORDER BY time;`).then(getRows);
};

const getTime = time => {
  return pool.query(`SELECT user_id, questions FROM schedules WHERE time=${time};`).then(getRows);
};

const formatStringArray = array => `{${array.map(qn => `"${qn}"`).join(",")}}`;

const getQuestions = async (userId, time) => {
  const res = await pool.query(`SELECT questions FROM schedules WHERE user_id=${userId} AND time=${time};`);
  return getFirst(res) ? getFirst(res).questions : [];
};

const add = (userId, time, questions) => {
  return pool.query(
    `INSERT INTO schedules(user_id, time, questions)
    VALUES(${userId}, ${time}, '${formatStringArray(questions)}');`);
};

const edit = (userId, time, newTime, newQuestions) => {
  return pool.query(
    `UPDATE schedules
    SET time=${newTime}, questions='${formatStringArray(newQuestions)}'
    WHERE user_id=${userId} AND time=${time};`);
};

const deleteSchedule = (userId, time) => {
  return pool.query(`DELETE FROM schedules WHERE user_id=${userId} AND time=${time};`);
};

module.exports = {
  getUser,
  getTime,
  getQuestions,
  add,
  edit,
  delete: deleteSchedule,
};
