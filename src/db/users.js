const { incrementXP } = require("../levels");
const { pool, getFirst } = require("./postgresql");

const create = async (userId) => {
  return pool.query(
    `INSERT INTO users(user_id, level, xp, idat)
    VALUES(${userId}, 1, 0, 0)
    ON CONFLICT DO NOTHING;`);
}

const progress = {
  get: (userId) => {
    return pool.query(`SELECT level, xp, pinned_message_id FROM users WHERE user_id=${userId}`).then(getFirst);
  },
  set: (userId, level, xp) => {
    return pool.query(`UPDATE users SET level=${level}, xp=${xp} WHERE user_id=${userId}`);
  },
  addXP: async (userId, additionalXP) => {
    const currentProgress = await progress.get(userId);
    const newProgress = incrementXP(currentProgress.level, currentProgress.xp, additionalXP);
    await progress.set(userId, newProgress.level, newProgress.xp);
    return {
      ...newProgress,
      pinnedMessageId: currentProgress.pinned_message_id,
      additionalXP
    }
  }
}

const pinnedMessageId = {
  get: (userId) => {
    return pool.query(`SELECT pinned_message_id FROM users WHERE user_id=${userId}`).then(getFirst);
  },
  set: (userId, pinnedMessageId) => {
    return pool.query(`UPDATE users SET pinned_message_id=${pinnedMessageId} WHERE user_id=${userId}`);
  },
}

const idat = {
  increment: (userId) => {
    return pool.query(`UPDATE users SET idat = idat + 1 WHERE user_id=${userId}`);
    // TODO: what does this return? can I make it return the current idat count?
    // TODO: check for IDAT achievement?
  }
}

const prevCommand = {
  get: async (userId) => {
    const res = await pool.query(`SELECT prev_command FROM users WHERE user_id=${userId}`);
    return getFirst(res).prev_command;
  },
  set: (userId, command) => {
    return pool.query(`UPDATE users SET prev_command='${command}' WHERE user_id=${userId}`);
  },
  reset: (userId) => {
    return prevCommand.set(userId, '');
  },
}

module.exports = {
  create,
  progress,
  pinnedMessageId,
  idat,
  prevCommand,
}