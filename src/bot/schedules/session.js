const db = require("../../db");
const { schedules, users: { prevCommand } } = db;
const { clean, MARKDOWN } = require("../../utils").telegram;

const { generateDateTime } = require("./utils");

function handleSession({ bot }) {
  bot.onText(/\/skip/, async ({ chatId, send }) => {
    const { command } = await prevCommand.get(chatId);
    if (command !== "scheduled") return;

    prevCommand.reset(chatId);
    db.reflections.cancel(chatId);
    send("Alright, skipping this session.");
  });

  bot.onText(/\/done/, async shortcuts => {
    const { chatId, send } = shortcuts;
    const { command, partial } = await prevCommand.get(chatId);
    if (command !== "scheduled") return;

    const { time, index } = partial;
    const questions = await schedules.getQuestions(chatId, time);

    if (index < questions.length) {
      send(clean(`*${questions[index]}*\n\n✅ /done with prompt`), MARKDOWN);
      prevCommand.set(chatId, "scheduled", { time, index: index + 1 });
    } else {
      const botMsg = await send("You've completed your scheduled journalling session. Good job!");
      const tz = await db.users.timezone.get(chatId);
      await bot.sendClosingStats(shortcuts, botMsg.message_id, generateDateTime(tz));
      await prevCommand.reset(chatId);
    }
  });

}

module.exports = handleSession;
