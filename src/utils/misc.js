const emojiTree = require("emoji-tree");

const prompts = require("../prompts.json");

const getRandomPrompt = () => {
  const index = Math.floor(Math.random() * prompts.random.length);
  return prompts.random[index];
};

const countEmojis = rawText => {
  const result = {};

  emojiTree(rawText)
    .filter(char => char.type === "emoji")
    .map(({ text: emoji }) => {
      if (!result[emoji]) result[emoji] = { emoji, count: 0 };
      result[emoji].count++;
    });
  return Object.values(result);
};

const emojiChart = emojis => {
  return emojis.map(({ emoji, count }) => emoji.repeat(count)).join("\n");
};

const formatHashtag = ({ hashtag, count }) => {
  return `${hashtag}: ${count}`;
};

const formatReflection = ({ start_id, name, hashtags = [] }) => {
  const reflectionInfo = [`*${name}*`, `/goto${start_id}`];
  if (hashtags.length > 0 && hashtags[0] !== null) reflectionInfo.push(`Hashtags: ${hashtags.join(", ")}`);
  return reflectionInfo.join("\n");
};

const handlePlural = (singular, plural) => count => `${count} ${count === 1 ? singular : plural}`;

const sum = arr => arr.reduce((x, y) => x + y, 0);
const average = arr => arr.length === 0 ? 0 : sum(arr) / arr.length;
const max = arr => Math.max(0, ...arr);

module.exports = {
  getRandomPrompt,
  countEmojis, emojiChart,
  formatHashtag, formatReflection,
  sum, average, max,
  handlePlural,
};
