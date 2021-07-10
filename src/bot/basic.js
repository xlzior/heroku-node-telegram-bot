const db = require("../db");
const errors = require("../db/errors");
const utils = require("../utils");
const { clean, MARKDOWN } = utils.telegram;
const { formatStats } = require("../levels");

const helpMessage = require("./help");

function handleBasic({ bot }) {
  bot.onText(/\/start(@lifexp_bot)?$/, async ({ send, chatId }, msg) => {
    await send(`Hello, ${msg.from.first_name}!`);

    const message = [
      "Welcome to LifeXP, a gamified journalling chatbot.\n",
      "I'm here to help you pen down your thoughts in a safe and convenient environment.\n",
      "Use /open to start a new journal entry.",
      "If you need a prompt to start off, let me know using /prompt.",
      "If you did something that you're proud of and want to celebrate it, try /ididathing.",
      "Finally, /close the journal entry and let your mind rest.\n",
      "I hope you have a meaningful journalling session.",
    ].join("\n");
    await send(message);

    try {
      await db.users.create(chatId);
      const messageId = await bot.sendAndPin(chatId, formatStats(1, 0, 0));
      db.users.pinnedMessageId.set(chatId, messageId);
    } catch (error) {
      if (error !== errors.USER_ALREADY_EXISTS) {
        console.error("error:", error);
      }
    }
  });

  bot.onText(/\/help/, ({ send }) => {
    send(clean(helpMessage.join("\n\n")), MARKDOWN);
  });

  bot.onText(/\/cancel/, async ({ send, chatId }) => {
    const { command } = await db.users.prevCommand.get(chatId);
    if (command) {
      send(`The command '${command}' has been cancelled.`, utils.telegram.REMOVE_KEYBOARD);
      if (command === "open") db.reflections.cancel(chatId);
      await db.users.prevCommand.reset(chatId);
    } else {
      send("There was no previous command.", utils.telegram.REMOVE_KEYBOARD);
    }
  });
}

module.exports = handleBasic;
