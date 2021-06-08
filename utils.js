const prompts = require('./prompts/prompts.json');
const emojiTree = require('emoji-tree');

const getRandomPrompt = () => {
  const index = Math.floor(Math.random() * prompts.random.length);
  return prompts.random[index];
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

const emojiChart = (emojiCounts) => {
  return Object.keys(emojiCounts)
    .map(emoji => {
      return emoji.repeat(emojiCounts[emoji])
    })
    .join('\n');
}

const sum = (arr) => arr.reduce((x, y) => x + y, 0)

const average = (arr) => sum(arr) / arr.length;

module.exports = {
  getRandomPrompt,
  countEmojis,
  emojiChart,
  sum,
  average,
}