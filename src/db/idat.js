const { checkForNewBadge } = require("../achievements");
const { getUserDb, getFb } = require("./dbUtils");

/* I did a thing */

const increment = (userId) => {
  const userDb = getUserDb(userId);
  const idatDb = userDb.child('idat');
  const achievementsDb = userDb.child('achievements');
  return getFb(userDb)
  .then(({ idat, achievements = {} }) => {
    idatDb.set(idat + 1);
    const newBadge = checkForNewBadge('idat', achievements.idat, idat + 1);
    const { hasNewBadge, currentLevel } = newBadge;
    if (hasNewBadge) {
      achievementsDb.update({ idat: currentLevel });
    }
    return newBadge;
  })
  .catch(error => console.error(error));
}

module.exports = {
  increment
}