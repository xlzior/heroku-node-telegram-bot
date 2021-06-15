const { getUserDb, getFb } = require("./dbUtils");

/* User */

const INITIAL_USER = {
  "progress": {
    "xp": 0,
    "level": 1
  },
  "idat": 0,
  "achievements": {
    "reflections": 0,
    "convoLength": 0,
    "hashtags": 0,
    "idat": 0
  }
};

const create = (userId) => {
  const userDb = getUserDb(userId);
  return getFb(userDb)
  .then(val => {
    console.info(`User ${userId} already exists: ${JSON.stringify(val)}`)
  })
  .catch(() => {
    userDb.set(INITIAL_USER)
  })
}

module.exports = {
  create,
}