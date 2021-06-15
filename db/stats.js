const { countTotalHashtags, sum, average } = require("../utils");
const { getUserDb, getFb } = require("./dbUtils");

/* Statistics */

const getStats = (userId) => {
  return getFb(getUserDb(userId))
  .then(({ progress, reflections = {}, hashtags = {}, idat }) => {
    const hashtagCount = countTotalHashtags(hashtags);
    const reflectionLengths = Object.values(reflections).map(({ start, end }) => end - start + 1);
    const totalLength = sum(reflectionLengths);
    const averageLength = average(reflectionLengths);
    const maximumLength = Math.max(...reflectionLengths);

    return {
      level: progress.level,
      xp: progress.xp,
      reflections: Object.keys(reflections).length,
      totalLength,
      averageLength,
      maximumLength,
      hashtags: hashtagCount,
      uniqueHashtags: Object.keys(hashtags).length,
      idat,
    }
  });
}

const getAchievements = (userId) => {
  const userDb = getUserDb(userId);
  return getFb(userDb.child('achievements'))
  .catch(() => ({}));
}

module.exports = {
  getStats,
  getAchievements,
}