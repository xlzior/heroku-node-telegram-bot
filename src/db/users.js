const { checkForNewBadge } = require("../achievements");
const { incrementXP } = require("../levels");
const { pool, getFirst } = require("./postgresql");
const achievementsDb = require("./achievements");
const errors = require("./errors");

const create = async chatId => {
  return pool.query(
    "INSERT INTO users(user_id, level, xp, idat) VALUES($1, 1, 0, 0);",
    [chatId])
    .catch(() => Promise.reject(errors.USER_ALREADY_EXISTS));
};

const progress = {
  get: async chatId => {
    const res = await pool.query("SELECT level, xp, pinned_message_id FROM users WHERE user_id=$1", [chatId]);
    return getFirst(res);
  },
  set: (chatId, level, xp) => {
    return pool.query("UPDATE users SET level=$1, xp=$2 WHERE user_id=$3", [level, xp, chatId]);
  },
  addXP: async (chatId, additionalXP) => {
    const currentProgress = await progress.get(chatId);
    const newProgress = incrementXP(currentProgress.level, currentProgress.xp, additionalXP);
    await progress.set(chatId, newProgress.level, newProgress.xp);
    return {
      ...newProgress,
      pinnedMessageId: currentProgress.pinned_message_id,
      additionalXP,
    };
  },
};

const pinnedMessageId = {
  get: async chatId => {
    const res = await pool.query("SELECT pinned_message_id FROM users WHERE user_id=$1", [chatId]);
    return getFirst(res);
  },
  set: (chatId, pinnedMessageId) => {
    return pool.query("UPDATE users SET pinned_message_id=$1 WHERE user_id=$2", [pinnedMessageId, chatId]);
  },
};

const idat = {
  get: async chatId => {
    const res = await pool.query("SELECT idat FROM users WHERE user_id=$1", [chatId]);
    return getFirst(res).idat;
  },
  increment: async chatId => {
    const res = await pool.query(
      "UPDATE users SET idat = idat + 1 WHERE user_id=$1 RETURNING idat",
      [chatId]);
    const idatCount = getFirst(res).idat;

    const currentIDATAchievement = await achievementsDb.get(chatId, "idat");
    const newBadge = checkForNewBadge("idat", currentIDATAchievement.level, idatCount);
    const { hasNewBadge, currentLevel } = newBadge;
    if (hasNewBadge) {
      achievementsDb.update(chatId, "idat", currentLevel);
    }
    return newBadge;
  },
};

const prevCommand = {
  get: async chatId => {
    const res = await pool.query("SELECT prev_command, partial FROM users WHERE user_id=$1;", [chatId]);
    return {
      command: getFirst(res).prev_command,
      partial: getFirst(res).partial,
    };
  },
  set: (chatId, command, partial={}) => {
    return pool.query(
      "UPDATE users SET prev_command=$1, partial=$2 WHERE user_id=$3;",
      [command, partial, chatId]);
  },
  reset: chatId => {
    return prevCommand.set(chatId, "");
  },
};

module.exports = {
  create,
  progress,
  pinnedMessageId,
  idat,
  prevCommand,
};
