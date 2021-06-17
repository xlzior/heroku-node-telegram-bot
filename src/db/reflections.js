const { checkForNewBadge } = require('../achievements');
const { pool, getFirst, getRows } = require("./postgresql");

const hashtagsDb = require('./hashtags');
const achievementsDb = require('./achievements');
const current = require('./current');

const getCount = (userId) => {
  return pool.query(`SELECT COUNT(*) FROM reflections WHERE user_id=${userId}`).then(getFirst);
}

const getLengths = (userId) => {
  return pool.query(`SELECT start, end FROM reflections WHERE user_id=${userId}`)
  .then(getRows)
  .then(rows => rows.map(({ start_id, end_id }) => {
    return end_id - start_id + 1;
  }));
}

const insert = (userId, start) => {
  return pool.query(`INSERT INTO reflections(user_id, start_id) VALUES(${userId}, ${start})`);
}

const update = (userId, start, end, name) => {
  return pool.query(`UPDATE reflections SET end_id='${end}', name='${name}' WHERE user_id=${userId} AND start_id=${start}`);
}

const isOpen = (userId) => {
  return current.getId(userId)
    .then(() => true)
    .catch(() => false);
}

const open = async (userId, start) => {
  try {
    await current.getId(userId);
    return Promise.reject("REFLECTION_ALREADY_OPEN");
  } catch (e) {
    insert(userId, start);
    current.setId(userId, start);
  }
}

const close = async (userId, end, name) => {
  const start = await current.getId(userId).catch(() => {
    return Promise.reject("NO_REFLECTION_OPEN");
  })

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