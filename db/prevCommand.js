const { getUserDb, getFb } = require("./dbUtils");

/* Previous command */

const update = (userId, command) => {
  const userDb = getUserDb(userId);
  return userDb.child('prevCommand').set(command);
}

const reset = (userId) => update(userId, {});

const get = (userId) => {
  const userDb = getUserDb(userId);
  return getFb(userDb.child('prevCommand'))
  .catch(() => Promise.reject("No previous command"));
}

module.exports = {
  update,
  reset,
  get
}