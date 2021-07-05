const db = require("../../db");
const { schedules } = db;
const { utcToLocal, utcToLocal24 } = require("./utils");

function handleManage({ bot, continueConversation }) {
  bot.onText(/\/manage_schedules/, async ({ send, chatId }) => {
    await send("Welcome to the scheduled journalling prompts feature. I can send you a fixed set of prompts every day at a time of your choosing.");

    const tz = await db.users.timezone.get(chatId);
    if (!tz) return send("Use /set_timezone to get started.");

    const userSchedules = await schedules.getUser(chatId);
    userSchedules.sort((a, b) => utcToLocal24(a.time, tz) - utcToLocal24(b.time, tz));
    if (userSchedules.length === 0) {
      send("Use /add_schedule to get started.");
    } else {
      const schedulesDisplay = userSchedules
        .map(({ time, questions }) => `${utcToLocal(time, tz)}: ${questions.length} prompt(s)\n${questions.join("\n")}`)
        .join("\n\n");
      const message = [
        "You currently have the following schedules set:",
        schedulesDisplay,
        "You can manage them using /add_schedule, /edit_schedule and /delete_schedule.",
      ].join("\n\n");
      send(message);
    }
  });

  bot.onText(/\/set_timezone/, ({ send, chatId }) => {
    send("What timezone are you in? Please respond in the format 'UTC+X' or 'UTC-X', where X is your offset from UTC/GMT time.");
    db.users.prevCommand.set(chatId, "set timezone");
  });

  continueConversation["set timezone"] = async ({ send, chatId }, msg) => {
    const tz = msg.text;
    if (tz.match(/UTC[+-]\d+/)) {
      send(`Alright, you have set your timezone to ${tz}. You can now add a new scheduled journalling session using /add_schedule`);
      db.users.timezone.set(chatId, tz);
      db.users.prevCommand.reset(chatId);
    } else {
      send("Please send a valid timezone in the format 'UTC+X' or 'UTC-X', where X is your offset from UTC/GMT time.");
    }
  };
}

module.exports = handleManage;
