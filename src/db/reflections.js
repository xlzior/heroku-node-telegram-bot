const { checkForNewBadge } = require('../achievements');
const { pool, getFirst, getRows } = require("./postgresql");

const hashtagsDb = require('./hashtags');
const achievementsDb = require('./achievements');
const current = require('./current');
const errors = require('./errors');

const getCount = async (userId) => {
  const res = await pool.query(`SELECT COUNT(*) FROM reflections WHERE user_id=${userId}`);
  return getFirst(res);
}

const getLengths = async (userId) => {
  const res = await pool.query(`SELECT start, end FROM reflections WHERE user_id=${userId}`);
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
  const reflectionsCount = getCount(userId)
  const hashtagsCount = hashtagsDb.getCount(userId)
  const achievements = await achievementsDb.get(userId)
  console.log('achievements :', achievements);

  const newAchievements = {};
  const convoLength = end - start + 1;
  const stats = [
    { type: "convoLength", value: convoLength },
    { type: "hashtags", value: await hashtagsCount },
    { type: "reflections", value: await reflectionsCount },
  ]
  stats.forEach(({ type, value }) => {
    // TODO: what format is achievements? how do I access the current achievement level?
    const newBadge = checkForNewBadge(type, achievements[type], value);
    const { hasNewBadge, previousLevel, currentLevel } = newBadge;
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