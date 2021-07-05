const db = require("../../db");
const { schedules, users: { prevCommand } } = db;
const { groupPairs, withKeyboard, REMOVE_KEYBOARD } = require("../../utils").telegram;

const { formatScheduleInfo, utcToLocal, localToUTC } = require("./utils");

function handleDelete({ bot, continueConversation }) {

  bot.onText(/\/delete_schedule/, async ({ send, chatId }) => {
    const userSchedules = await schedules.getUser(chatId);
    const tz = await db.users.timezone.get(chatId);

    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      const localTime = utcToLocal(time);
      send(`Alright, you only have one schedule at ${formatScheduleInfo(localTime, questions)}\n\nAre you sure you would like to delete this scheduled journalling session? Please send 'Yes' to confirm.`);
      prevCommand.set(chatId, "schedule - delete - confirm", { time: localTime, tz });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => utcToLocal(time, tz)));
      send("Which schedule would you like to delete?", withKeyboard(keyboard));
      prevCommand.set(chatId, "schedule - delete - select");
    }
  });

  continueConversation["schedule - delete - select"] = async ({ send, chatId }, msg) => {
    const time = msg.text;
    const tz = await db.users.timezone.get(chatId);
    const questions = await schedules.getQuestions(chatId, localToUTC(time, tz));
    if (questions.length > 0) {
      send(`You have chosen to delete the schedule at ${formatScheduleInfo(time, questions)}\n\nAre you sure you would like to delete this session? Please send 'Yes' to confirm.`, REMOVE_KEYBOARD);
      prevCommand.set(chatId, "schedule - delete - confirm", { time, tz });
    } else {
      send(`You do not have a session at ${time}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation["schedule - delete - confirm"] = async ({ send, chatId }, msg, { time, tz }) => {
    if (msg.text === "Yes") {
      send("You have deleted your session.");
      schedules.delete(chatId, localToUTC(time, tz));
    } else {
      send("Deleting cancelled.");
    }
    prevCommand.reset(chatId);
  };
}

module.exports = handleDelete;
