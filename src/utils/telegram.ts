export const FORCE_REPLY = { reply_markup: { force_reply: true } };
export const REMOVE_KEYBOARD = { reply_markup: { remove_keyboard: true } };
export const MARKDOWN = { parse_mode: "MarkdownV2" };

export const groupPairs = array => {
  const result = [];
  for (let i = 0; i < array.length; i += 2) {
    result.push(array.slice(i, i + 2));
  }
  return result;
};
export const withKeyboard = (keyboard, resize_keyboard = true, one_time_keyboard = true) => {
  return { reply_markup: { keyboard, resize_keyboard, one_time_keyboard } };
};
export const withInlineKeyboard = keyboard => {
  return keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {};
};
export const replyTo = messageId => ({ reply_to_message_id: messageId });

const RESERVED_CHARACTERS = ["-", "#", "+", "_", "(", ")", "."];
export const clean = rawText => {
  let result = rawText;
  RESERVED_CHARACTERS.forEach(char => {
    result = result.replace(new RegExp(`\\${char}`, "g"), `\\${char}`);
  });
  result = result.replace(/<\/?i>/g, "_");
  return result;
};

