const db = require("../../db");
const { schedules } = db;
const { utcToLocal } = require("./utils");

function handleManage({ bot, continueConversation }) {
  bot.onText(/\/manage_schedules/, async ({ send, chatId }) => {
    const userSchedules = await schedules.getUser(chatId);
    const tz = await db.users.timezone.get(chatId);

    if (userSchedules.length === 0) {
      await send("Welcome to the scheduled journalling prompts feature. I can send you a fixed set of prompts every day at a time of your choosing.");
      const startCommand = tz ? "/add_schedule" : "/set_timezone";
      await send(`Use ${startCommand} to get started.`);
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

  bot.onText(/\/set_timezone/, ({ send }) => {
    send("What timezone are you in? Please respond in the format 'UTC+X' or 'UTC-X' where X is your offset from UTC/GMT time.");
    db.users.prevCommand.set("set timezone");
  });

  continueConversation["set timezone"] = async ({ send, chatId }, msg) => {
    const tz = msg.text;
    // TODO: validate timezone a bit?
    await db.users.timezone.set(chatId, tz);
    send(`Alright, you have set your timezone to ${tz}. You can now add a new scheduled journalling session using /add_schedule`);
    db.users.prevCommand.reset(chatId);
  };
}

module.exports = handleManage;
