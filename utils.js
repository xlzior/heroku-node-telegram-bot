const prompts = require('./prompts.json');
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

const countTotalHashtags = hashtags => {
  return Object.values(hashtags)
    .map(tagObj => Object.values(tagObj).length)
    .reduce((acc, item) => acc + item, 0); // sum
}

const sum = (arr) => arr.reduce((x, y) => x + y, 0)

const average = (arr) => sum(arr) / arr.length;

const RESERVED_CHARACTERS = ["-", "#", "+", "_"];

const cleanMarkdownReserved = rawText => {
  let result = rawText;
  RESERVED_CHARACTERS.forEach(char => {
    result = result.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  })
  return result;
}

module.exports = {
  getRandomPrompt,
  countEmojis, emojiChart,
  countTotalHashtags,
  sum, average,
  cleanMarkdownReserved
}