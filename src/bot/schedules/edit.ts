import db = require("../../db");
import utils = require("../../utils");

const { schedules, users: { prevCommand, timezone } } = db;
const { groupPairs, withKeyboard, REMOVE_KEYBOARD } = utils.telegram;
const { validateTime, formatScheduleInfo, utcToLocal, localToUTC, utcToLocal24 } = utils.time;

// continueConversation
const SELECT = "schedule - edit - select";
const TIME = "schedule - edit - time";
const QUESTIONS = "schedule - edit - questions";

function handleEdit(bot, continueConversation) {
  bot.onText(/\/edit_schedule/, async ({ send, chatId }) => {
    const tz = await timezone.get(chatId);
    if (!tz) return send("Use /set_timezone to get started.");

    const userSchedules = await schedules.getUser(chatId);
    userSchedules.sort((a, b) => utcToLocal24(a.time, tz) - utcToLocal24(b.time, tz));
    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      const localTime = utcToLocal(time, tz);
      send(`Alright, you only have one schedule at ${formatScheduleInfo(localTime, questions)}\n\nPlease send a new time for this scheduled session in 12-hour format (e.g. 9pm).`);
      prevCommand.set(chatId, TIME, { time: localTime, tz });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => utcToLocal(time, tz)));
      send("Which schedule would you like to edit?", withKeyboard(keyboard));
      prevCommand.set(chatId, SELECT, { tz });
    }
  });

  continueConversation[SELECT] = async ({ send, chatId }, msg, { tz }) => {
    const time = validateTime(msg.text);
    if (!time) return send("Please send a valid time using the keyboard provided");

    const questions = await schedules.getQuestions(chatId, localToUTC(time, tz));
    if (questions.length > 0) {
      send(`You have chosen to edit the schedule at ${formatScheduleInfo(time, questions)}\n\nPlease send a new time for this scheduled session in 12-hour format (e.g. 9pm).`, REMOVE_KEYBOARD);
      // TODO: implement "no change" option?
      prevCommand.set(chatId, TIME, { time, tz });
    } else {
      send(`You do not have a session at ${time}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation[TIME] = async({ send, chatId }, msg, { time, tz }) => {
    const newTime = validateTime(msg.text);
    if (!newTime) return send("Please send a valid time in 12-hour format (e.g. 9pm)");

    const questions = await schedules.getQuestions(chatId, localToUTC(newTime, tz));
    if (time.toLowerCase() !== newTime.toLowerCase() && questions.length > 0) {
      send(`You already have a session set for ${formatScheduleInfo(newTime, questions)}\n\nYou cannot have two journalling sessions scheduled for the same time.`);
      prevCommand.reset(chatId);
    } else {
      send("What question prompts would you like to use in this session? You may have more than one prompt, just be sure to separate them with a line break.");
      prevCommand.set(chatId, QUESTIONS, { time, tz, newTime });
    }
  };

  continueConversation[QUESTIONS] = async({ send, chatId }, msg, { time, tz, newTime }) => {
    const newQuestions = msg.text.split("\n").filter(Boolean);
    send(`Okay, your new session will be at ${formatScheduleInfo(newTime, newQuestions)}`);
    schedules.edit(chatId, localToUTC(time, tz), localToUTC(newTime, tz), newQuestions);
    prevCommand.reset(chatId);
  };
}

export = handleEdit;