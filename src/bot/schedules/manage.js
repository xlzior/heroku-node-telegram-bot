const db = require("../../db");
const { schedules, users: { prevCommand, timezone } } = db;

const utils = require("../../utils");
const { clean, MARKDOWN } = utils.telegram;
const { utcToLocal, utcToLocal24 } = utils.time;

function handleManage({ bot, continueConversation }) {
  bot.onText(/\/manage_schedules/, async ({ send, chatId }) => {
    await send("Welcome to the scheduled journalling prompts feature. I can send you a fixed set of prompts every day at a time of your choosing.");

    const tz = await timezone.get(chatId);
    if (!tz) return send("Use /set_timezone to get started.");

    const userSchedules = await schedules.getUser(chatId);
    userSchedules.sort((a, b) => utcToLocal24(a.time, tz) - utcToLocal24(b.time, tz));
    if (userSchedules.length === 0) {
      send("Use /add_schedule to get started.");
    } else {
      const numberOfPrompts = utils.handlePlural("prompt", "prompts");
      const schedulesDisplay = userSchedules
        .map(({ time, questions }) => {
          return [
            `*${utcToLocal(time, tz)}: ${numberOfPrompts(questions.length)}*`,
            `${questions.join("\n")}`,
          ].join("\n");
        })
        .join("\n\n");
      const message = [
        "You currently have the following schedules set:",
        schedulesDisplay,
        "You can manage them using /add_schedule, /edit_schedule and /delete_schedule.",
      ].join("\n\n");
      send(clean(message), MARKDOWN);
    }
  });

  bot.onText(/\/set_timezone/, ({ send, chatId }) => {
    send("What timezone are you in? Please respond in the format 'UTC+X' or 'UTC-X', where X is your offset from UTC/GMT time.");
    prevCommand.set(chatId, "set timezone");
  });

  continueConversation["set timezone"] = async ({ send, chatId }, msg) => {
    const tz = msg.text;
    if (tz.match(/UTC[+-]\d+/)) {
      send(`Alright, you have set your timezone to ${tz}. You may now make use of time-related features such as scheduled journalling sessions or bedtime. Use /add_schedule or /set_bedtime to get started.`);
      timezone.set(chatId, tz);
      prevCommand.reset(chatId);
    } else {
      send("Please send a valid timezone in the format 'UTC+X' or 'UTC-X', where X is your offset from UTC/GMT time.");
    }
  };
}

module.exports = handleManage;
