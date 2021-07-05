const db = require("../../db");
const { schedules, users: { prevCommand } } = db;
const { groupPairs, withKeyboard, REMOVE_KEYBOARD } = require("../../utils").telegram;

const { validateTime, formatScheduleInfo, utcToLocal, localToUTC } = require("./utils");

function handleEdit({ bot, continueConversation }) {
  bot.onText(/\/edit_schedule/, async ({ send, chatId }) => {
    const userSchedules = await schedules.getUser(chatId);
    const tz = await db.users.timezone.get(chatId);
    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      const localTime = utcToLocal(time);
      send(`Alright, you only have one schedule at ${formatScheduleInfo(localTime, questions)}\n\nPlease send a new time for this scheduled session.`);
      prevCommand.set(chatId, "schedule - edit - time", { time: localTime, tz });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => utcToLocal(time)));
      send("Which schedule would you like to edit?", withKeyboard(keyboard));
      prevCommand.set(chatId, "schedule - edit - select");
    }
  });

  continueConversation["schedule - edit - select"] = async ({ send, chatId }, msg) => {
    const time = msg.text;
    if (!time) return send("Please send a valid time using the keyboard provided");

    const tz = await db.users.timezone.get(chatId);
    const questions = await schedules.getQuestions(chatId, localToUTC(time, tz));
    if (questions.length > 0) {
      send(`You have chosen to edit the schedule at ${formatScheduleInfo(time, questions)}\n\nPlease send a new time for this scheduled session.`, REMOVE_KEYBOARD);
      // TODO: implement "no change" option?
      prevCommand.set(chatId, "schedule - edit - time", { time, tz });
    } else {
      send(`You do not have a session at ${time}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation["schedule - edit - time"] = async({ send, chatId }, msg, { time, tz }) => {
    const newTime = validateTime(msg.text);
    const questions = await schedules.getQuestions(chatId, newTime);
    if (time.toLowerCase() !== newTime.toLowerCase() && questions.length > 0) {
      send(`You already have a session set for ${formatScheduleInfo(newTime, questions)}\n\nYou cannot have two journalling sessions scheduled for the same time.`);
      prevCommand.reset(chatId);
    } else {
      send("What question prompts would you like to use in this session? You may have more than one question, just be sure to separate them with a line break.");
      prevCommand.set(chatId, "schedule - edit - questions", { time, tz, newTime });
    }
  };

  continueConversation["schedule - edit - questions"] = async({ send, chatId }, msg, { time, tz, newTime }) => {
    const newQuestions = msg.text.split("\n").filter(Boolean);
    send(`Okay, your new session will be at ${formatScheduleInfo(newTime, newQuestions)}`);
    console.log({
      chatId,
      time: localToUTC(time, tz),
      newTime: localToUTC(newTime, tz),
      newQuestions,
    });
    schedules.edit(chatId, localToUTC(time, tz), localToUTC(newTime, tz), newQuestions);
    prevCommand.reset(chatId);
  };
}

module.exports = handleEdit;
