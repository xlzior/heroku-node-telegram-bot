const { incrementXP } = require("../levels");
const { getUserDb, getFb } = require("./dbUtils");

/* Progress */

const setPinnedMessageId = (userId, pinnedMessageId) => {
  getUserDb(userId)
  .child('progress/pinnedMessageId')
  .set(pinnedMessageId);
}

const addXP = (userId, additionalXP) => {
  const xpDb = getUserDb(userId).child('progress');
  return getFb(xpDb)
  .then(({ level, xp: originalXP, pinnedMessageId }) => {
    const { newXP, newLevel, levelledUp } = incrementXP(level, originalXP, additionalXP);
    xpDb.update({ xp: newXP, level: newLevel });
    return { level: newLevel, levelledUp, originalXP, additionalXP, newXP, pinnedMessageId };
  })
}

const get = (userId) => {
  const userDb = getUserDb(userId);
  return getFb(userDb.child('progress'));
}

module.exports = {
  setPinnedMessageId,
  addXP,
  get,
}