const { checkForNewBadge } = require("../achievements");
const { countTotalHashtags } = require("../utils");
const { getUserDb, getFb } = require("./dbUtils");

/* Reflections */

const getCurrentId = (userId) => {
  const userDb = getUserDb(userId);
  return getFb(userDb.child('currentReflection'))
  .catch(() => {
    return Promise.reject("No current reflection");
  })
}

const getCurrent = (userId) => {
  const userDb = getUserDb(userId);
  return getCurrentId(userId)
  .then(reflectionId => userDb.child(`reflections/${reflectionId}`));
}

const isOpen = (userId) => {
  return getCurrent(userId)
  .then(() => true)
  .catch(() => false);
}

const open = (userId, start) => {
  const userDb = getUserDb(userId);
  return getCurrent(userId)
  .then(() => {
    return Promise.reject("A reflection is already in progress, please /close the reflection before opening a new one.")
  })
  .catch(() => {
    userDb.child(`reflections/${start}/start`).set(start);
    userDb.child('currentReflection').set(start);
  })
}

const close = (userId, end, name) => {
  const userDb = getUserDb(userId);
  const achievementsDb = userDb.child('achievements');
  return getFb(userDb)
  .then(({ currentReflection: start, achievements = {}, hashtags, reflections }) => {
    userDb.child(`reflections/${start}`).update({ end, name });
    userDb.child(`currentReflection`).set(null);

    const newAchievements = {};
    const convoLength = end - start + 1;
    const stats = [
      { type: "convoLength", value: convoLength },
      { type: "hashtags", value: countTotalHashtags(hashtags) },
      { type: "reflections", value: Object.keys(reflections).length },
    ]
    stats.forEach(({ type, value }) => {
      const newBadge = checkForNewBadge(type, achievements[type], value);
      const { hasNewBadge, previousLevel, currentLevel } = newBadge;
      if (hasNewBadge) {
        newAchievements[type] = { previousLevel, currentLevel };
        achievementsDb.update({ [type]: currentLevel })
      }
    })

    return { convoLength, newAchievements };
    // TODO: check for emojis achievement
  })
  .catch(error => {
    console.log('error :', error);
    return Promise.reject("You have not started a reflection. Use /open to start a new reflection");
  })
}

module.exports = {
  getCurrentId,
  getCurrent,
  isOpen,
  open,
  close
}