const { checkForNewBadge } = require("../achievements");
const { incrementXP } = require("../levels");
const { pool, getFirst } = require("./postgresql");
const achievementsDb = require("./achievements");
const errors = require("./errors");

const create = async userId => {
  return pool.query(
    "INSERT INTO users(user_id, level, xp, idat) VALUES($1, 1, 0, 0);",
    [userId])
    .catch(() => Promise.reject(errors.USER_ALREADY_EXISTS));
};

const progress = {
  get: async userId => {
    const res = await pool.query("SELECT level, xp, pinned_message_id FROM users WHERE user_id=$1", [userId]);
    return getFirst(res);
  },
  set: (userId, level, xp) => {
    return pool.query("UPDATE users SET level=$1, xp=$2 WHERE user_id=$3", [level, xp, userId]);
  },
  addXP: async (userId, additionalXP) => {
    const currentProgress = await progress.get(userId);
    const newProgress = incrementXP(currentProgress.level, currentProgress.xp, additionalXP);
    await progress.set(userId, newProgress.level, newProgress.xp);
    return {
      ...newProgress,
      pinnedMessageId: currentProgress.pinned_message_id,
      additionalXP,
    };
  },
};

const pinnedMessageId = {
  get: async userId => {
    const res = await pool.query("SELECT pinned_message_id FROM users WHERE user_id=$1", [userId]);
    return getFirst(res);
  },
  set: (userId, pinnedMessageId) => {
    return pool.query("UPDATE users SET pinned_message_id=$1 WHERE user_id=$2", [pinnedMessageId, userId]);
  },
};

const idat = {
  get: async userId => {
    const res = await pool.query("SELECT idat FROM users WHERE user_id=$1", [userId]);
    return getFirst(res).idat;
  },
  increment: async userId => {
    const res = await pool.query(
      "UPDATE users SET idat = idat + 1 WHERE user_id=$1 RETURNING idat",
      [userId]);
    const idatCount = getFirst(res).idat;

    const currentIDATAchievement = await achievementsDb.get(userId, "idat");
    const newBadge = checkForNewBadge("idat", currentIDATAchievement.level, idatCount);
    const { hasNewBadge, currentLevel } = newBadge;
    if (hasNewBadge) {
      achievementsDb.update(userId, "idat", currentLevel);
    }
    return newBadge;
  },
};

const prevCommand = {
  get: async userId => {
    const res = await pool.query("SELECT prev_command, partial FROM users WHERE user_id=$1;", [userId]);
    return {
      command: getFirst(res).prev_command,
      partial: getFirst(res).partial,
    };
  },
  set: (userId, command, partial={}) => {
    return pool.query(
      "UPDATE users SET prev_command=$1, partial=$2 WHERE user_id=$3;",
      [command, partial, userId]);
  },
  reset: userId => {
    return prevCommand.set(userId, "");
  },
};

module.exports = {
  create,
  progress,
  pinnedMessageId,
  idat,
  prevCommand,
};
