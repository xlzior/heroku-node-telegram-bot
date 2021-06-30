const db = require("../db");
const utils = require("../utils");

function handleIDAT({ bot, continueConversation }) {
  bot.onText(/\/ididathing/, async ({ send, chatId }) => {
    await send("Congrats! Whether it's a small win or a big win, let's celebrate it!");
    send("So tell me, what did you do?", utils.telegram.FORCE_REPLY);
    db.users.prevCommand.set(chatId, "idat - what");
  });

  continueConversation["idat - what"] = ({ send, chatId }) => {
    send("Amazing! How do you feel about it now?", utils.telegram.FORCE_REPLY);
    db.users.prevCommand.set(chatId, "idat - feeling");
  };

  continueConversation["idat - feeling"] = ({ send, chatId }) => {
    send("Nice~ On a scale of 1 to 10, how difficult would you rate it?", utils.telegram.FORCE_REPLY);
    db.users.prevCommand.set(chatId, "idat - difficulty");
  };

  const DIFFICULTY_XP_MULTIPLIER = 100;

  continueConversation["idat - difficulty"] = async ({ send, chatId }, msg) => {
    const match = msg.text.match(/\d+/);
    if (!match) return send("Please enter a valid number between 1 and 10 (inclusive)");

    const difficulty = parseInt(match[0]);
    if (difficulty < 1 || difficulty > 10) {
      send("Please enter a valid number between 1 and 10 (inclusive)");
    } else {
      // user feedback
      if (difficulty <= 3) {
        send("That's cool! Small wins count too~");
      } else if (difficulty <= 6) {
        send("Nice, good job!");
      } else if (difficulty <= 9) {
        send("Wowowow, big win right there :D");
      } else if (difficulty === 10) {
        send("THAT'S AMAZING!! YOOOO I'M SO PROUD OF YOU!!");
      }

      // give XP
      const xpData = await db.users.progress.addXP(chatId, difficulty * DIFFICULTY_XP_MULTIPLIER);
      await bot.notifyXP(chatId, "your achievement", xpData);

      // give badge
      const { hasNewBadge, previousLevel, currentLevel } = await db.users.idat.increment(chatId);
      if (hasNewBadge) {
        await bot.notifyBadges(chatId, "idat", previousLevel, currentLevel);
      }

      return db.users.prevCommand.reset(chatId);
    }
  };
}

module.exports = handleIDAT;
