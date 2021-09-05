import { EditMessageCaptionOptions } from "node-telegram-bot-api";

import { EMOTIONS, HandlerArguments } from "../types/continueConversation";
import { clean, MARKDOWN, withInlineKeyboard } from "../utils/telegram";
import {
  INTRO_TEXT, WHEEL_IMAGE,
  EMPTY_PATH, EMPTY_SELECTION,
  BACK, CANCEL, DONE,
  getKeyboard,
  getPartial, updatePartial,
  updatePath, toggleEmotion, done,
} from "../utils/wheel";

export default function handleBasic({ bot }: HandlerArguments): void {
  bot.handle(/^\/emotion_wheel/, async ({ chatId }) => {
    const keyboard = getKeyboard(EMPTY_PATH, EMPTY_SELECTION);
    const options = { caption: clean(INTRO_TEXT), ...withInlineKeyboard(keyboard), ...MARKDOWN };
    bot.sendPhoto(chatId, WHEEL_IMAGE, options);
    updatePartial(chatId, EMPTY_PATH, EMPTY_SELECTION);
  });

  bot.on("callback_query", async ({ id, message: msg, data }) => {
    const chatId = msg.chat.id;
    const [type, l1, l2, l3] = data.split(" - ");
    if (type !== EMOTIONS) return;

    const { path, selection } = await getPartial(chatId);

    const editMessage = (newMessage: string, newKeyboard: EditMessageCaptionOptions = {}) => {
      bot.editMessageCaption(clean(newMessage), {
        ...newKeyboard,
        ...(MARKDOWN as EditMessageCaptionOptions),
        chat_id: chatId,
        message_id: msg.message_id,
      });
    };

    if (l1 === BACK) {
      const newPath = path.split(" - ").slice(0, -1).join(" - ");
      updatePath(editMessage, chatId, newPath, selection);
    } else if (l1 === DONE || l1 === CANCEL) {
      done(editMessage, chatId, selection);
    } else if (l1 && l2 && l3) {
      toggleEmotion(editMessage, chatId, path, selection, `${l1} - ${l2} - ${l3}`);
    } else if (l1 && l2) {
      updatePath(editMessage, chatId, `${l1} - ${l2}`, selection);
    } else if (l1) {
      updatePath(editMessage, chatId, l1, selection);
    }

    bot.answerCallbackQuery(id);
  });
}
