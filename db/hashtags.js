const { getUserDb, getFb } = require("./dbUtils");
const { getCurrentId } = require("./reflections");

/* Hashtags */

const add = (userId, hashtags = []) => {
  if (hashtags.length === 0) return;

  const userDb = getUserDb(userId);
  return getCurrentId(userId)
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

const get = (userId) => {
  const userDb = getUserDb(userId);
  return getFb(userDb)
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

module.exports = {
  add,
  get,
}