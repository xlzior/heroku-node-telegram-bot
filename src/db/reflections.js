const { checkForNewBadge } = require('../achievements');
const { pool, getFirst, getRows } = require("./postgresql");

const hashtagsDb = require('./hashtags');
const achievementsDb = require('./achievements');
const current = require('./current');
const errors = require('./errors');

const getCount = async (userId) => {
  const res = await pool.query(`SELECT COUNT(*) FROM reflections WHERE user_id=${userId}`);
  return parseInt(getFirst(res).count);
}

const getLengths = async (userId) => {
  const res = await pool.query(`SELECT start_id, end_id FROM reflections WHERE user_id=${userId}`);
  return getRows(res).map(({ start_id, end_id }) => end_id - start_id + 1);
}

const insert = (userId, start) => {
  return pool.query(`INSERT INTO reflections(user_id, start_id) VALUES(${userId}, ${start})`);
}

const update = (userId, start, end, name) => {
  return pool.query(`UPDATE reflections SET end_id='${end}', name='${name}' WHERE user_id=${userId} AND start_id=${start}`);
}

const isOpen = (userId) => {
  return current.getId(userId).then(Boolean);
}

const open = async (userId, start) => {
  const reflectionId = await current.getId(userId);
  if (reflectionId) {
    return Promise.reject(errors.REFLECTION_ALREADY_OPEN);
  } else {
    insert(userId, start);
    current.setId(userId, start);
  }
}

const close = async (userId, end, name) => {
  const start = await current.getId(userId)
  
  if (!start) return Promise.reject(errors.NO_REFLECTION_OPEN);

  current.resetId(userId);
  update(userId, start, end, name);

  const convoLength = end - start + 1;
  const stats = [
    { type: "convoLength", value: convoLength },
    { type: "reflections", value: await getCount(userId) },
    { type: "hashtags", value: await hashtagsDb.getTotalCount(userId) },
  ]

  const achievements = await achievementsDb.getAll(userId)
  const newAchievements = {};

  stats.forEach(({ type, value }) => {
    const previousAchievement = achievements.find(elem => elem.type === type);
    const previousLevel = previousAchievement ? previousAchievement.level : 0;
    const { hasNewBadge, currentLevel } = checkForNewBadge(type, previousLevel, value);
    if (hasNewBadge) {
      newAchievements[type] = { previousLevel, currentLevel };
      achievementsDb.update(userId, type, currentLevel);
    }
  })

  return { convoLength, newAchievements };
}
module.exports = {
  current,
  getCount, getLengths,
  isOpen, open, close,
}