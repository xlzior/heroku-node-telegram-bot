const { DateTime } = require("luxon");

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
    const res = await pool.query("SELECT level, xp, streak, pinned_message_id FROM users WHERE user_id=$1", [chatId]);
    return getFirst(res);
  },
  set: (chatId, level, xp) => {
    return pool.query("UPDATE users SET level=$1, xp=$2 WHERE user_id=$3", [level, xp, chatId]);
  },
  updateStreak: async (chatId, newReflectionDate) => {
    const res = await pool.query("SELECT streak, last_reflection_date, tz FROM users WHERE user_id=$1", [chatId]);
    const { streak, last_reflection_date: lastReflectionDate, tz } = getFirst(res);
    const current = DateTime
      .fromSeconds(newReflectionDate, { zone: tz })
      .set({ hour: 0, minute: 0, second: 0 });

    let newStreak;
    if (lastReflectionDate) {
      const previous = DateTime.fromFormat(lastReflectionDate, "yyyy-MM-dd", { zone: tz });
      const delta = current.diff(previous, "day").values.days;

      if (delta === 0) newStreak = streak;          // maintain streak
      else if (delta === 1) newStreak = streak + 1; // increment streak
      else if (delta > 1) newStreak = 1;            // streak broken
    } else {
      newStreak = 1;                                // initialise streak to 1
    }
    return pool.query("UPDATE users SET streak=$1, last_reflection_date=$2 WHERE user_id=$3;", [newStreak, current.toFormat("yyyy-MM-dd"), chatId]);
  },
  addXP: async (chatId, additionalXP) => {
    const currentProgress = await progress.get(chatId);
    const newProgress = incrementXP(currentProgress.level, currentProgress.xp, additionalXP);
    await progress.set(chatId, newProgress.level, newProgress.xp);
    return {
      ...newProgress,
      pinnedMessageId: currentProgress.pinned_message_id,
      streak: currentProgress.streak,
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

const timezone = {
  get: async chatId => {
    const res = await pool.query("SELECT tz FROM users WHERE user_id=$1", [chatId]);
    return getFirst(res).tz;
  },
  set: async (chatId, tz) => {
    return pool.query("UPDATE users SET tz=$1 WHERE user_id=$2", [tz, chatId]);
  },
};

const sleep = {
  // bedtime and wakeup_time are stored as user's local timezone
  getBedtime: async chatId => {
    const res = await pool.query("SELECT bedtime, tz FROM users WHERE user_id=$1", [chatId]);
    const { bedtime: time, tz } = getFirst(res);
    return time ? DateTime.fromFormat(time, "HH:mm:ss", { zone: tz }) : time;
  },
  getWakeup: async chatId => {
    const res = await pool.query("SELECT wakeup_time, tz FROM users WHERE user_id=$1", [chatId]);
    const { wakeup_time: time, tz } = getFirst(res);
    return time ? DateTime.fromFormat(time, "HH:mm:ss", { zone: tz }) : time;
  },
  set: async (chatId, bedtime, wakeup) => {
    return pool.query("UPDATE users SET bedtime=$1, wakeup_time=$2 WHERE user_id=$3", [bedtime, wakeup, chatId]);
  },
};

module.exports = {
  create,
  progress,
  pinnedMessageId,
  idat,
  prevCommand,
  timezone,
  sleep,
};
