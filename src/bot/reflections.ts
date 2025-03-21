import * as db from "../db";
import { REFLECTION_ALREADY_OPEN } from "../db/errors";
import { getRandomPrompt, telegram, countEmojis } from "../utils";
import { replyTo } from "../utils/telegram";
import { HandlerArguments, OPEN_REFLECTION, CLOSE_REFLECTION } from "../types/continueConversation";

export default function handleReflections({ bot, continueConversation }: HandlerArguments): void {
  bot.handle(/^\/prompt/, ({ send }) => {
    send(getRandomPrompt());
  });

  bot.handle(/^\/echo(@lifexp_bot)? (.+)/, ({ send }, msg, match) => {
    send(match[2]);
  });

  bot.handle(/^\/echo(@lifexp_bot)?$/, ({ send }) => {
    send("Send /echo [text], and I'll repeat the [text] back at you. This can be useful for prompting yourself with a question you already have in mind, or telling yourself something you need/want to hear.");
  });

  bot.handle(/^\/open/, async ({ send, chatId }, msg) => {
    try {
      if (msg.reply_to_message) {
        const replyId = msg.reply_to_message.message_id;
        await db.reflections.open(chatId, replyId);
        send("Alright, starting a journalling session from this message onwards.\n\nIf you meant to start a fresh journalling session, please /cancel this reflection and then send /open on its own (instead of as a reply).", replyTo(replyId));
      } else {
        await db.reflections.open(chatId, msg.message_id);
        send("Let's start a journalling session! If you need a prompt, you can use /prompt. If not, just start typing and I'll be here when you need me.");
      }
      await db.users.prevCommand.set(chatId, OPEN_REFLECTION);
    } catch (error) {
      if (error === REFLECTION_ALREADY_OPEN) {
        send("A reflection is already in progress, please /close the reflection before opening a new one.");
      } else {
        console.error("error:", error);
      }
    }
  });

  bot.handle(/^\/close/, async ({ send, chatId }) => {
    const { command } = await db.users.prevCommand.get(chatId);
    if (command === "scheduled") {
      return send("You're currently doing a scheduled journalling session. When you are done with the given prompt, send /done.");
    }

    const isOpen = await db.reflections.isOpen(chatId);
    if (isOpen) {
      send("Whew! Nice journalling session. How would you like to name this reflection for future browsing?",
        telegram.FORCE_REPLY);
      db.users.prevCommand.set(chatId, CLOSE_REFLECTION);
    } else {
      send("You have not started a reflection. Use /open to start a new reflection");
      db.users.prevCommand.reset(chatId);
    }
  });

  continueConversation[CLOSE_REFLECTION] = async (shortcuts, msg) => {
    const { send, chatId } = shortcuts;
    await send(`Good job! You wrapped up the '${msg.text}' reflection. I'm proud of you!`);
    await bot.sendClosingStats(shortcuts, msg.message_id, msg.text, msg.date);
    await db.users.prevCommand.reset(chatId);
  };

  bot.onMessage(async ({ chatId }, msg) => {
    // KIV: automatically open a reflection for a smoother journalling experience?

    if (msg.entities) {
      const hashtags = msg.entities
        .filter(({ type }) => type === "hashtag")
        .map(({ offset, length }) => msg.text.substr(offset, length));
      db.hashtags.add(chatId, hashtags);
    }

    db.emojis.add(chatId, countEmojis(msg.text));
  });
}
