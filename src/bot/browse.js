const db = require("../db");
const utils = require("../utils");
const { generateReflectionsList, generateHashtagList } = utils.pagination;

const {
  clean, MARKDOWN,
  groupPairs, withKeyboard, REMOVE_KEYBOARD,
  replyTo,
} = utils.telegram;

function handleBrowse({ bot, continueConversation }) {
  bot.onText(/\/reflections/, async ({ send, chatId }) => {
    const { error = false, message, options } = await generateReflectionsList(chatId, 1);
    if (!error) send("All reflections");
    send(message, options);
  });

  bot.on("callback_query", async ({ id, message: msg, data }) => {
    const [type, pageNumber] = data.split(" - ");
    if (type === "reflections") {
      if (pageNumber === "current") return;
      const { message, options } = await generateReflectionsList(msg.chat.id, parseInt(pageNumber));
      bot.editMessageText(message, {
        ...options,
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      bot.answerCallbackQuery(id);
    }
  });

  bot.onText(/\/hashtags/, async ({ send, chatId }) => {
    const hashtags = await db.hashtags.getAll(chatId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    const message = `You've used these hashtags in your reflections:
    \n${hashtags.map(utils.formatHashtag).join("\n")}`;
    await send(clean(message), MARKDOWN);
    await send("Use /hashtag to view all reflections with a particular hashtag");
  });

  bot.onText(/\/hashtag(@lifexp_bot)?$/, async ({ send, chatId }) => {
    const hashtags = await db.hashtags.getAll(chatId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    db.users.prevCommand.set(chatId, "hashtag");
    const keyboard = groupPairs(hashtags.map(({ hashtag }) => hashtag));
    send("Alright, which hashtag would you like to browse?", withKeyboard(keyboard));
  });

  continueConversation["hashtag"] = async ({ send, chatId }, msg) => {
    const { error = false, message, options } = await generateHashtagList(chatId, msg.text, 1);
    if (!error) send(`Reflections with the hashtag ${msg.text}`, REMOVE_KEYBOARD);
    send(message, options);
    db.users.prevCommand.reset(chatId);
  };

  bot.on("callback_query", async ({ id, message: msg, data }) => {
    const [type, hashtag, pageNumber] = data.split(" - ");
    if (type === "hashtag") {
      if (pageNumber === "current") return;

      const { message, options } = await generateHashtagList(
        msg.chat.id, hashtag, parseInt(pageNumber));
      bot.editMessageText(message, {
        ...options,
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      bot.answerCallbackQuery(id);
    }
  });

  bot.onText(/\/goto(\d+)/, ({ send }, msg, match) => {
    send("The reflection started here!", replyTo(match[1]))
    .catch(() => send("Reflection not found."));
  });
}

module.exports = handleBrowse;
