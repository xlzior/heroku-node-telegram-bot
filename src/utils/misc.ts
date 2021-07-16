import * as emojiTree from "emoji-tree";

import * as prompts from "../prompts.json";

export const getRandomPrompt = () => {
  const index = Math.floor(Math.random() * prompts.random.length);
  return prompts.random[index];
};

export const countEmojis = rawText => {
  const result = {};

  emojiTree(rawText)
    .filter(char => char.type === "emoji")
    .map(({ text: emoji }) => {
      if (!result[emoji]) result[emoji] = { emoji, count: 0 };
      result[emoji].count++;
    });
  return Object.values(result);
};

export const emojiChart = emojis => {
  return emojis.map(({ emoji, count }) => emoji.repeat(count)).join("\n");
};

export const handlePlural = (singular, plural) => count => `${count} ${count === 1 ? singular : plural}`;

export const sum = arr => arr.reduce((x, y) => x + y, 0);
export const average = arr => arr.length === 0 ? 0 : sum(arr) / arr.length;
export const max = arr => Math.max(0, ...arr);

export const formatHashtag = ({ hashtag, count }) => {
  return `${hashtag}: ${count}`;
};

export const formatReflection = ({ start_id, name, hashtags = [] }) => {
  const reflectionInfo = [`*${name}*`, `/goto${start_id}`];
  if (hashtags.length > 0 && hashtags[0] !== null) reflectionInfo.push(`Hashtags: ${hashtags.join(", ")}`);
  return reflectionInfo.join("\n");
};

const numberOfPrompts = handlePlural("prompt", "prompts");
export const formatQuest = ({ id, name, questions }) => {
  return [
    `*${name}* (${numberOfPrompts(questions.length)})`,
    `👁 /preview_quest_${id}`,
  ].join("\n");
};
