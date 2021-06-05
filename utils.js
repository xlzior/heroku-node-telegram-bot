const prompts = require('./prompts/prompts.json');
const emojiTree = require('emoji-tree');

const getRandomPrompt = () => {
  const index = Math.floor(Math.random() * prompts.length);
  return prompts[index];
}

const countEmojis = (rawText) => {
  const emojiCounts = {};
  
  const emojis = emojiTree(rawText)
  .filter(char => char.type === 'emoji')
  .map(emoji => emoji.text)
  emojis.map(emoji => {
    if (!emojiCounts[emoji]) emojiCounts[emoji] = 0;
    emojiCounts[emoji]++;
  })
  return emojiCounts;
}

module.exports = {
  getRandomPrompt,
  countEmojis
}