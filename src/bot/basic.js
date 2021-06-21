const db = require("../db");
const { formatLevel } = require("../levels");

function handleBasic({ bot }) {
  bot.onText(/\/start/, async ({ send, userId, chatId }, msg) => {
    send(`Hello, ${msg.from.first_name}! Welcome to LifeXP, a gamified journalling chatbot.`);

    await db.users.create(userId);
    const messageId = await bot.sendAndPin(chatId, formatLevel(1, 0));
    db.users.pinnedMessageId.set(userId, messageId);
  });

  bot.onText(/\/help/, ({ send }) => {
    const helpMessage = [
      "Welcome to LifeXP, a gamified journalling chatbot.\n",
      "I'm here to help you pen down your thoughts in a safe and convenient environment.\n",
      "Use /open to start a new journal entry.",
      "If you need a prompt to start off, let me know using /prompt.",
      "If you did something that you're proud of and want to celebrate it, try /ididathing.",
      "Finally, /close the journal entry and let your mind rest.\n",
      "I hope you have a meaningful journalling session.",
    ].join("\n");
    send(helpMessage);
  });

  bot.onText(/\/cancel/, async ({ send, userId }) => {
    await db.users.prevCommand.reset(userId);
    send("The previous command has been cancelled.");
  });
}

module.exports = handleBasic;
