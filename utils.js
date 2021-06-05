const prompts = require('./prompts/prompts.json');
const emojiTree = require('emoji-tree');

const getRandomPrompt = () => {
  const index = Math.floor(Math.random() * prompts.length);
  return prompts[index];
}

const countEmojis = (rawText) => {
  const result = {};
  
  emojiTree(rawText)
    .filter(char => char.type === 'emoji')
    .map(emojiData => emojiData.text)
    .map(emoji => {
      if (!result[emoji]) result[emoji] = 0;
      result[emoji]++;
    })
  return result;
}

module.exports = {
  getRandomPrompt,
  countEmojis
}