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
  },
};

const get = db => {
  return db.get()
  .then(snapshot => {
    if (snapshot.exists()) {
      return Promise.resolve(snapshot.val());
    } else {
      return Promise.reject("No snapshot");
    }
  })
}

const createUser = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb)
  .then(val => {
    console.log(`User ${userId} already exists: ${JSON.stringify(val)}`)
  })
  .catch(() => {
    userDb.set(INITIAL_USER)
  })
}

/* Previous command */

const updatePrevCommand = (userId, command) => {
  const userDb = getUserDb(userId);
  return userDb.child('prev_command').set(command);
}

const resetPrevCommand = (userId) => updatePrevCommand(userId, {});

const getPrevCommand = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb.child('prev_command'))
  .catch(() => {
    return Promise.reject("No previous command");
  })
}

/* EXP */

const setPinnedMessageId = (userId, pinnedMessageId) => {
  const xpDb = getUserDb(userId).child('progress/pinned_message_id')
  xpDb.set(pinnedMessageId);
}

const updateXP = (userId, newXP) => {
  const xpDb = getUserDb(userId).child('progress');
  return get(xpDb)
  .then(({ xp: currentXP, pinned_message_id: pinnedMessageId }) => {
    xpDb.update({ xp: currentXP + newXP });
    return [currentXP, newXP, currentXP + newXP, pinnedMessageId];
  })
}

const getXP = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb.child('progress'));
}

/* Reflections */

const getCurrentReflectionId = (userId) => {
  const userDb = getUserDb(userId);
  return get(userDb.child('current_reflection'))
  .catch(() => {
    return Promise.reject("No current reflection");
  })
}

const getCurrentReflection = (userId) => {
  const userDb = getUserDb(userId);
  return getCurrentReflectionId(userId)
  .then(reflectionId => userDb.child(`reflections/${reflectionId}`));
}

const openReflection = (userId, start) => {
  const userDb = getUserDb(userId);
  return getCurrentReflection(userId)
  .then(() => {
    return Promise.reject("A reflection is already in progress, please /close the reflection before opening a new one.")
  })
  .catch(() => {
    userDb.child(`reflections/${start}/start`).set(start);
    userDb.child('current_reflection').set(start);
  })
}

const closeReflection = (userId, end, name) => {
  const userDb = getUserDb(userId);
  return getCurrentReflectionId(userId)
  .then(start => {
    const currentReflection = userDb.child(`reflections/${start}`)
    currentReflection.update({ end, name });
    userDb.child(`current_reflection`).set(null);
    return end - start + 1;
  })
  .catch(() => {
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
  .catch(error => console.log(error));
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
  .catch(error => console.log(error));
  // TODO: how to collate how many emojis i've used this month?
}

module.exports = {
  createUser,
  setPinnedMessageId, updateXP, getXP,
  updatePrevCommand, resetPrevCommand, getPrevCommand,
  openReflection, closeReflection,
  addHashtags, getHashtags,
  addEmojis
}