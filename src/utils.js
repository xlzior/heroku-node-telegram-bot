const emojiTree = require("emoji-tree");

const prompts = require("./prompts.json");

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

const formatHashtag = limit => ({ hashtag, messages }) => {
  const firstLine = `*${hashtag}: ${messages.length}*`;
  const nextLines = messages
    .map(([ messageId, name ]) => `- /goto${messageId} ${name}`)
    .slice(0, limit)
    .join("\n");
  return `${firstLine}\n${nextLines}`;
};

const formatReflection = ({ start_id, name, hashtags }) => {
  return [
    `*${name}*`,
    `/goto${start_id}`,
    `Hashtags: ${hashtags.join(", ")}`,
  ].join("\n");
};

const sum = arr => arr.reduce((x, y) => x + y, 0);
const average = arr => sum(arr) / arr.length;
const max = arr => Math.max(...arr);

/* Telegram-specific */

const FORCE_REPLY = { reply_markup: { force_reply: true } };
const REMOVE_KEYBOARD = { reply_markup: { remove_keyboard: true } };
const MARKDOWN = { parse_mode: "MarkdownV2" };

const withKeyboard = (keyboard, resize_keyboard = true, one_time_keyboard = true) => {
  return { reply_markup: { keyboard, resize_keyboard, one_time_keyboard } };
};
const groupPairs = array => {
  const result = [];
  for (let i = 0; i < array.length; i += 2) {
    result.push(array.slice(i, i + 2));
  }
  return result;
};
const replyTo = messageId => ({ reply_to_message_id: messageId });

const RESERVED_CHARACTERS = ["-", "#", "+", "_", "(", ")"];
const clean = rawText => {
  let result = rawText;
  RESERVED_CHARACTERS.forEach(char => {
    result = result.replace(new RegExp(`\\${char}`, "g"), `\\${char}`);
  });
  result = result.replace(/<\/?i>/g, "_");
  return result;
};

const telegram = {
  FORCE_REPLY,
  REMOVE_KEYBOARD,
  MARKDOWN,
  withKeyboard, groupPairs,
  replyTo,
  clean,
};

module.exports = {
  getRandomPrompt,
  countEmojis, emojiChart,
  formatHashtag, formatReflection,
  sum, average, max,
  telegram,
};
