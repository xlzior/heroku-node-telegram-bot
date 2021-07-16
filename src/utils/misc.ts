import * as emojiTree from "emoji-tree";

import * as prompts from "../prompts.json";

export const getRandomPrompt = () => {
  const index = Math.floor(Math.random() * prompts.random.length);
  return prompts.random[index];
};

/* EMOJIS */

export const countEmojis = (rawText: string) => {
  const result = emojiTree(rawText)
    .filter(({ type }) => type === "emoji")
    .reduce((acc: {}, { text: emoji }) => {
      if (!acc[emoji]) acc[emoji] = { emoji, count: 0 };
      acc[emoji].count++;
      return acc;
    }, {});
  return Object.values(result);
};

export const emojiChart = (emojis: { emoji: string; count: number; }[]) => {
  return emojis.map(({ emoji, count }) => emoji.repeat(count)).join("\n");
};

/* MATH */

export const sum = (arr: number[]) => arr.reduce((x, y) => x + y, 0);
export const average = (arr: number[]) => arr.length === 0 ? 0 : sum(arr) / arr.length;
export const max = (arr: number[]) => Math.max(0, ...arr);

/* STRINGS */

export const handlePlural =
  (singular: string, plural: string) =>
  (count: number) =>
  `${count} ${count === 1 ? singular : plural}`;

const numberOfPrompts = handlePlural("prompt", "prompts");

/* FORMATTING */

export const formatHashtag = ({ hashtag, count }) => {
  return `${hashtag}: ${count}`;
};

export const formatReflection = ({ start_id, name, hashtags = [] }) => {
  const reflectionInfo = [`*${name}*`, `/goto${start_id}`];
  if (hashtags.length > 0 && hashtags[0] !== null) reflectionInfo.push(`Hashtags: ${hashtags.join(", ")}`);
  return reflectionInfo.join("\n");
};

export const formatQuest = ({ id, name, questions }) => {
  return [
    `*${name}* (${numberOfPrompts(questions.length)})`,
    `👁 /preview_quest_${id}`,
  ].join("\n");
};
