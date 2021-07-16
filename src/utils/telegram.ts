import { InlineKeyboardButton, KeyboardButton, SendMessageOptions } from "node-telegram-bot-api";

export const FORCE_REPLY: SendMessageOptions = { reply_markup: { force_reply: true } };
export const REMOVE_KEYBOARD: SendMessageOptions = { reply_markup: { remove_keyboard: true } };
export const MARKDOWN: SendMessageOptions = { parse_mode: "MarkdownV2" };

export const groupPairs = (array: any[]) => {
  const result = [];
  for (let i = 0; i < array.length; i += 2) {
    result.push(array.slice(i, i + 2));
  }
  return result;
};

export const withKeyboard = (
  keyboard: KeyboardButton[][],
  resize_keyboard = true,
  one_time_keyboard = true
): SendMessageOptions => {
  return { reply_markup: { keyboard, resize_keyboard, one_time_keyboard } };
};

export const withInlineKeyboard = (keyboard: InlineKeyboardButton[][]): SendMessageOptions => {
  return keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {};
};

export const replyTo = (messageId: number): SendMessageOptions =>
  ({ reply_to_message_id: messageId });

const RESERVED_CHARACTERS = ["-", "#", "+", "_", "(", ")", "."];
export const clean = (rawText: string): string => {
  const result = RESERVED_CHARACTERS.reduce((text, char) => {
    return text.replace(new RegExp(`\\${char}`, "g"), `\\${char}`);
  }, rawText);
  return result.replace(/<\/?i>/g, "_");
};
