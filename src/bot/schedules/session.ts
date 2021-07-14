import db = require("../../db");
import utils = require("../../utils");

const { schedules, reflections, users: { prevCommand, timezone } } = db;
const { clean, MARKDOWN } = utils.telegram;
const { generateDateTime } = utils.time;

const SCHEDULED = "scheduled";

function handleSession(bot, continueConversation) {
  bot.onText(/\/skip/, async ({ chatId, send }) => {
    const { command } = await prevCommand.get(chatId);
    if (command !== SCHEDULED) return;

    prevCommand.reset(chatId);
    reflections.cancel(chatId);
    send("Alright, skipping this session.");
  });

  bot.onText(/\/done/, async (shortcuts, msg) => {
    const { chatId, send } = shortcuts;
    const { command, partial } = await prevCommand.get(chatId);
    if (command !== SCHEDULED) return;

    const { time, index } = partial;
    const questions = await schedules.getQuestions(chatId, time);

    if (index < questions.length) {
      send(clean(`*${questions[index]}*\n\n✅ /done`), MARKDOWN);
      prevCommand.set(chatId, SCHEDULED, { time, index: index + 1 });
    } else {
      const botMsg = await send("You've completed your scheduled journalling session. Good job!");
      const tz = await timezone.get(chatId);
      await bot.sendClosingStats(shortcuts, botMsg.message_id, generateDateTime(tz), msg.date);
      await prevCommand.reset(chatId);
    }
  });
}

export = handleSession;
