import db = require("../../db");
import utils = require("../../utils");

const { schedules, users: { prevCommand, timezone } } = db;
const { groupPairs, withKeyboard, REMOVE_KEYBOARD } = utils.telegram;
const { formatScheduleInfo, utcToLocal, localToUTC, validateTime, utcToLocal24 } = utils.time;

// continueConversation
const SELECT = "schedule - delete - select";
const CONFIRM = "schedule - delete - confirm";

function handleDelete(bot, continueConversation) {
  bot.onText(/\/delete_schedule/, async ({ send, chatId }) => {
    const tz = await timezone.get(chatId);
    if (!tz) return send("Use /set_timezone to get started.");

    const userSchedules = await schedules.getUser(chatId);
    userSchedules.sort((a, b) => utcToLocal24(a.time, tz) - utcToLocal24(b.time, tz));
    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      const localTime = utcToLocal(time, tz);
      send(`Alright, you only have one schedule at ${formatScheduleInfo(localTime, questions)}\n\nAre you sure you would like to delete this scheduled journalling session? Please send 'Yes' to confirm.`);
      prevCommand.set(chatId, CONFIRM, { time: localTime, tz });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => utcToLocal(time, tz)));
      send("Which schedule would you like to delete?", withKeyboard(keyboard));
      prevCommand.set(chatId, SELECT, { tz });
    }
  });

  continueConversation[SELECT] = async ({ send, chatId }, msg, { tz }) => {
    const time = validateTime(msg.text);
    if (!time) return send("Please send a valid time using the keyboard provided");

    const questions = await schedules.getQuestions(chatId, localToUTC(time, tz));
    if (questions.length > 0) {
      send(`You have chosen to delete the schedule at ${formatScheduleInfo(time, questions)}\n\nAre you sure you would like to delete this session? Please send 'Yes' to confirm.`, REMOVE_KEYBOARD);
      prevCommand.set(chatId, CONFIRM, { time, tz });
    } else {
      send(`You do not have a session at ${time}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation[CONFIRM] = async ({ send, chatId }, msg, { time, tz }) => {
    if (msg.text === "Yes") {
      send("You have deleted your session.");
      schedules.delete(chatId, localToUTC(time, tz));
    } else {
      send("Deleting cancelled.");
    }
    prevCommand.reset(chatId);
  };
}

export = handleDelete;
