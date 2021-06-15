const { getFb } = require("./dbUtils");
const { getCurrent } = require("./reflections");

/* Emojis */

const add = (userId, emojis = {}) => {
  if (Object.keys(emojis).length === 0) return;

  return getCurrent(userId)
  .then(currentReflection => {
    return getFb(currentReflection.child('emoji'))
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

const get = (userId) => {
  return getCurrent(userId)
  .then(currentReflection => getFb(currentReflection.child('emoji')) || {})
  .catch(() => ({}));
}

module.exports = {
  add,
  get,
}