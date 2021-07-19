import * as db from "../db";
import { generateReflectionsList, generateHashtagsList, generateHashtagList } from "../utils/pagination";
import { groupPairs, withKeyboard, REMOVE_KEYBOARD, replyTo } from "../utils/telegram";
import { HandlerArguments, HASHTAG } from "../types/continueConversation";

export default function handleBrowse({ bot, continueConversation }: HandlerArguments): void {
  bot.handle(/\/reflections/, async ({ send, chatId }) => {
    const { error = false, message, options } = await generateReflectionsList(chatId, 1);
    if (!error) await send("All reflections");
    await send(message, options);
  });

  bot.handle(/\/hashtags/, async ({ send, chatId }) => {
    const { error = false, message, options } = await generateHashtagsList(chatId, 1);
    if (!error) await send("All hashtags");
    await send(message, options);
    await send("Use /hashtag to view all reflections with a particular hashtag");
  });

  bot.on("callback_query", async ({ id, message: msg, data }) => {
    const [type, pageNumber] = data.split(" - ");
    const generateList = {
      reflections: generateReflectionsList,
      hashtags: generateHashtagsList,
    };
    if (generateList[type]) {
      if (pageNumber === "current") return;
      const { message, options } = await generateList[type](msg.chat.id, parseInt(pageNumber));
      bot.editMessageText(message, {
        ...options,
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      bot.answerCallbackQuery(id);
    }
  });

  bot.handle(/\/hashtag(@lifexp_bot)?$/, async ({ send, chatId }) => {
    const hashtags = await db.hashtags.getAll(chatId, null, 0);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    db.users.prevCommand.set(chatId, HASHTAG);
    const keyboard = groupPairs(hashtags.map(({ hashtag }) => hashtag));
    send("Alright, which hashtag would you like to browse?", withKeyboard(keyboard));
  });

  continueConversation[HASHTAG] = async ({ send, chatId }, msg) => {
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

  bot.handle(/\/goto(\d+)/, ({ send }, msg, match) => {
    send("The reflection started here!", replyTo(parseInt(match[1])))
    .catch(() => send("Reflection not found."));
  });
}
