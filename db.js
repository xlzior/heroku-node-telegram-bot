const { incrementXP } = require('./levels');
const { countTotalHashtags, sum, average } = require('./utils');
const { checkForNewBadge } = require('./achievements');

const firebase = require('firebase');
const firebaseConfig = require('./firebaseConfig');
firebase.initializeApp(firebaseConfig);

const dbRef = firebase.database().ref();
const usersDbRef = dbRef.child('users');
const getUserDb = userId => usersDbRef.child(userId);

/* User */

const INITIAL_USER = {
  "progress": {
    "xp": 0,
    "level": 1
  },
  "idat": 0,
  "achievements": {
    "reflections": 0,
    "convoLength": 0,
    "emojis": 0,
    "hashtags": 0,
    "idat": 0
  }
};

const get = db => {
  return db.get()
  .then(snapshot => {
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return Promise.reject("No snapshot");
    }
  })
}

const createUser = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb)
  .then(val => {
    console.info(`User ${userId} already exists: ${JSON.stringify(val)}`)
  })
  .catch(() => {
    userDb.set(INITIAL_USER)
  })
}

/* Previous command */

const updatePrevCommand = (userId, command) => {
  const userDb = getUserDb(userId);
  return userDb.child('prevCommand').set(command);
}

const resetPrevCommand = (userId) => updatePrevCommand(userId, {});

const getPrevCommand = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb.child('prevCommand'))
  .catch(() => Promise.reject("No previous command"));
}

/* Progress */

const setPinnedMessageId = (userId, pinnedMessageId) => {
  getUserDb(userId)
  .child('progress/pinnedMessageId')
  .set(pinnedMessageId);
}

const addXP = (userId, additionalXP) => {
  const xpDb = getUserDb(userId).child('progress');
  return get(xpDb)
  .then(({ level, xp: originalXP, pinnedMessageId }) => {
    const { newXP, newLevel, levelledUp } = incrementXP(level, originalXP, additionalXP);
    xpDb.update({ xp: newXP, level: newLevel });
    return { level: newLevel, levelledUp, originalXP, additionalXP, newXP, pinnedMessageId };
  })
}

const getProgress = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb.child('progress'));
}

/* Reflections */

const getCurrentReflectionId = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb.child('currentReflection'))
  .catch(() => {
    return Promise.reject("No current reflection");
  })
}

const getCurrentReflection = (userId) => {
  const userDb = getUserDb(userId);
  return getCurrentReflectionId(userId)
  .then(reflectionId => userDb.child(`reflections/${reflectionId}`));
}

const isReflectionOpen = (userId) => {
  return getCurrentReflection(userId)
  .then(() => true)
  .catch(() => false);
}

const openReflection = (userId, start) => {
  const userDb = getUserDb(userId);
  return getCurrentReflection(userId)
  .then(() => {
    return Promise.reject("A reflection is already in progress, please /close the reflection before opening a new one.")
  })
  .catch(() => {
    userDb.child(`reflections/${start}/start`).set(start);
    userDb.child('currentReflection').set(start);
  })
}

const closeReflection = (userId, end, name) => {
  const userDb = getUserDb(userId);
  const achievementsDb = userDb.child('achievements');
  return get(userDb)
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

/* Hashtags */

const addHashtags = (userId, hashtags = []) => {
  if (hashtags.length === 0) return;

  const userDb = getUserDb(userId);
  return getCurrentReflectionId(userId)
  .then(reflectionId => {
    // update reflection's hashtags
    const currentReflection = userDb.child(`reflections/${reflectionId}`)
    const currentHashtags = currentReflection.child('hashtags');
    const updates = {}
    hashtags.map(tag => {
      const newPostKey = currentHashtags.push().key;
      updates[newPostKey] = tag;
    })
    currentHashtags.update(updates);

    // update user's hashtags
    hashtags.map(rawTag => {
      const tag = rawTag.substring(1);
      userDb.child(`hashtags/${tag}`).push(reflectionId);
    })
  })
  .catch(error => console.error(error));
}

const getHashtags = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb)
  .then(({ hashtags: rawHashtags, reflections }) => {
    const hashtags = Object.keys(rawHashtags);
    const hashtagsWithCount = hashtags.map(hashtag => {
      const rawMessageIds = Object.values(rawHashtags[hashtag]);
      const dedupedIds = [...new Set(rawMessageIds)];
      const messages = dedupedIds.map(messageId => ({ messageId, name: reflections[messageId].name }))
      return { hashtag, messages }
    });
    return hashtagsWithCount;
  })
  .catch(() => {
    return Promise.reject("You have no hashtags saved. /open a conversation and use hashtags to categorise your entries.")
  })
}

/* Emojis */

const addEmojis = (userId, emojis = {}) => {
  if (Object.keys(emojis).length === 0) return;

  return getCurrentReflection(userId)
  .then(currentReflection => {
    return get(currentReflection.child('emoji'))
    .then(oldEmojis => {
      for (const emoji in emojis) {
        emojis[emoji] += oldEmojis[emoji] || 0;
      }
      currentReflection.child('emoji').update(emojis);
    })
    .catch(() => {
      currentReflection.child('emoji').set(emojis);
    })
  })
  .catch(error => console.error(error));
  // TODO: how to collate how many emojis i've used this month?
}

const getEmojis = (userId) => {
  return getCurrentReflection(userId)
  .then(currentReflection => get(currentReflection.child('emoji')) || {})
  .catch(() => ({}));
}

/* I did a thing */

const incrementIDAT = (userId) => {
  const userDb = getUserDb(userId);
  const idatDb = userDb.child('idat');
  const achievementsDb = userDb.child('achievements');
  return get(userDb)
  .then(({ idat, achievements = {} }) => {
    idatDb.set(idat + 1);
    const newBadge = checkForNewBadge('idat', achievements.idat, idat + 1);
    const { hasNewBadge, previousLevel, currentLevel } = newBadge;
    if (hasNewBadge) {
      achievementsDb.set({ idat: currentLevel });
    }
    return newBadge;
  })
  .catch(error => console.error(error));
}

/* Statistics */

const getStats = (userId) => {
  return get(getUserDb(userId))
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
  return get(userDb.child('achievements'));
}

module.exports = {
  createUser,
  setPinnedMessageId, addXP, getProgress,
  updatePrevCommand, resetPrevCommand, getPrevCommand,
  openReflection, closeReflection, isReflectionOpen,
  addHashtags, getHashtags,
  addEmojis, getEmojis,
  incrementIDAT,
  getStats, getAchievements
}