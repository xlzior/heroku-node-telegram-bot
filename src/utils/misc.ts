import * as emojiTree from "emoji-tree";

import * as prompts from "../../data/prompts.json";
import * as resources from "../../data/resources.json";
import { Emoji, Hashtag, Quest, Reflection } from "../types/entities";
import { Resource } from "../types/data";

export const getRandomPrompt = (): string => {
  const index = Math.floor(Math.random() * prompts.random.length);
  return prompts.random[index];
};

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const formatResources = ({ type, text }: Resource): string => {
  switch (type) {
    case "yoga":
      return `Would you like to try some yoga? Here's a video to get you started: ${text}`;
    case "article":
      return `I found this article you might be interested in: ${text}`;
    case "video":
      return `Here's a video that might help: ${text}`;
    case "meditation":
      return `Meditation is a useful technique for our mental health. Here's a video that might help: ${text}`;
    case "exercise":
      return `Our body thrives on exercise. ${text}`;
    case "joke":
      return `Let me tell you a joke!\n${text}`;
    default:
      return text;
  }
};

export const getResources = (key: string): string[] => {
  const rawResources = shuffle(resources[key] || []);
  return rawResources.slice(0, 2).map(formatResources);
};

/* EMOJIS */

export const countEmojis = (rawText: string): Emoji[] => {
  const result = emojiTree(rawText)
    .filter(({ type }) => type === "emoji")
    .reduce((acc: Record<string, { emoji: string, count: number }>, { text: emoji }) => {
      if (!acc[emoji]) acc[emoji] = { emoji, count: 0 };
      acc[emoji].count++;
      return acc;
    }, {});
  return Object.values(result);
};

export const emojiChart = (emojis: Emoji[]): string => {
  return emojis.map(({ emoji, count }) => emoji.repeat(count)).join("\n");
};

/* MATH */

export const sum = (arr: number[]): number => arr.reduce((x, y) => x + y, 0);
export const average = (arr: number[]): number => arr.length === 0 ? 0 : sum(arr) / arr.length;
export const max = (arr: number[]): number => Math.max(0, ...arr);

/* STRINGS */

export const handlePlural =
  (singular: string, plural: string) =>
  (count: number): string =>
  `${count} ${count === 1 ? singular : plural}`;

const numberOfPrompts = handlePlural("prompt", "prompts");

/* FORMATTING */

export const formatHashtag = ({ hashtag, count }: Hashtag): string => {
  return `${hashtag}: ${count}`;
};

export const formatReflection = ({ start_id, name, hashtags = [] }: Reflection): string => {
  const reflectionInfo = [`*${name}*`, `/goto${start_id}`];
  if (hashtags.length > 0 && hashtags[0] !== null) reflectionInfo.push(`Hashtags: ${hashtags.join(", ")}`);
  return reflectionInfo.join("\n");
};

export const formatQuest = ({ id, name, questions }: Quest): string => {
  return [
    `*${name}* (${numberOfPrompts(questions.length)})`,
    `👁 /preview_quest_${id}`,
  ].join("\n");
};
