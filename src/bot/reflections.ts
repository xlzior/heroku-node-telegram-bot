import db = require("../db");
import errors = require("../db/errors");
import utils = require("../utils");

function handleReflections(bot, continueConversation) {
  bot.onText(/\/prompt/, ({ send }) => {
    send(utils.getRandomPrompt());
  });

  bot.onText(/\/echo(@lifexp_bot)? (.+)/, ({ send }, msg, match) => {
    send(match[2]);
  });

  bot.onText(/\/echo(@lifexp_bot)?$/, ({ send }) => {
    send("Send /echo [text], and I'll repeat the [text] back at you. This can be useful for prompting yourself with a question you already have in mind, or telling yourself something you need/want to hear.");
  });

  bot.onText(/\/open/, async ({ send, chatId }, msg) => {
    try {
      await db.reflections.open(chatId, msg.message_id);
      send("Let's start a journalling session! If you need a prompt, you can use /prompt. If not, just start typing and I'll be here when you need me.");
      await db.users.prevCommand.set(chatId, "open");
    } catch (error) {
      if (error === errors.REFLECTION_ALREADY_OPEN) {
        send("A reflection is already in progress, please /close the reflection before opening a new one.");
      } else {
        console.error("error:", error);
      }
    }
  });

  bot.onText(/\/close/, async ({ send, chatId }) => {
    const { command } = await db.users.prevCommand.get(chatId);
    if (command === "scheduled") {
      return send("You're currently doing a scheduled journalling session. When you are done with the given prompt, send /done.");
    }

    const isOpen = await db.reflections.isOpen(chatId);
    if (isOpen) {
      send("Whew! Nice journalling session. How would you like to name this reflection for future browsing?",
        utils.telegram.FORCE_REPLY);
      db.users.prevCommand.set(chatId, "close");
    } else {
      send("You have not started a reflection. Use /open to start a new reflection");
      db.users.prevCommand.reset(chatId);
    }
  });

  continueConversation["close"] = async (shortcuts, msg) => {
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

    db.emojis.add(chatId, utils.countEmojis(msg.text));
  });
}

export = handleReflections;
