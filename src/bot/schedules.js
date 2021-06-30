const db = require("../db");
const utils = require("../utils");

const { schedules, users: { prevCommand } } = db;
const { groupPairs, withKeyboard, REMOVE_KEYBOARD } = utils.telegram;

const parseTime = rawText => {
  const time = parseInt(rawText);
  if (isNaN(time)) return false;
  if (time < 0) return false;
  if (time > 2359) return false;
  return time;
};

const formatTime = time => {
  const hour = Math.floor(time / 100);
  return hour < 12 ? `${hour}am` : `${(hour - 1) % 12 + 1}pm`;
};

const generateName = time => {
  const today = (new Date()).toLocaleDateString();
  // TODO: who's locale is this?
  return `${today} ${formatTime(time)}`;
};

const formatScheduleInfo = (time, questions) => {
  return `${formatTime(time)} with the following ${questions.length} question(s):\n${questions.join("\n")}`;
};

function handleSchedules({ bot, continueConversation }) {
  bot.onText(/\/skip/, async ({ chatId, send }) => {
    const { command } = await prevCommand.get(chatId);
    if (command !== "scheduled") return;

    db.reflections.cancel(chatId);
    send("Alright, skipping this session.");
  });

  bot.onText(/\/done/, async ({ chatId, send }) => {
    const { command, partial } = await prevCommand.get(chatId);
    if (command !== "scheduled") return;

    const { time, index } = partial;
    const questions = await schedules.getQuestions(chatId, time);

    if (index < questions.length) {
      send(`${questions[index]}\n\n(when finished, send /done)`);
      prevCommand.set(chatId, "scheduled", { time, index: index + 1 });
    } else {
      const botMsg = await send("You've completed your scheduled journalling session. Good job!");
      db.reflections.close(chatId, botMsg.message_id, generateName(time));
      prevCommand.reset(chatId);
    }
  });

  bot.onText(/\/manage_schedules/, async ({ send, chatId }) => {
    const userSchedules = await schedules.getUser(chatId);

    if (userSchedules.length === 0) {
      send("Welcome to the scheduled journalling prompts feature. I can send you a fixed set of prompts every day at a time of your choosing. Use /add_schedule to get started.");
    } else {
      const schedulesDisplay = userSchedules
        .map(({ time, questions }) => `${formatTime(time)}: ${questions.length} questions`)
        .join("\n");
      send(`You currently have the following schedules set:\n${schedulesDisplay}\n\nYou can manage them using /add_schedule, /edit_schedule and /delete_schedule.`);
    }
  });

  bot.onText(/\/add_schedule/, ({ send, chatId }) => {
    send("Nice, let's create a new scheduled journalling session! What time would you like to have this session every day? Please send a timestamp in 24-hour format (e.g. '2100' for 9pm).");
    prevCommand.set(chatId, "schedule - add - time");
  });

  continueConversation["schedule - add - time"] = async ({ send, chatId }, msg) => {
    const time = parseTime(msg.text);
    if (!time) {
      return send("Please send a valid timestamp in 24-hour format (e.g. '2100' for 9pm)");
    }
    // TODO: must be on the hour?

    const questions = await schedules.getQuestions(chatId, time);
    if (questions.length > 0) {
      send(`You already have a session set for ${formatScheduleInfo(time, questions)}\n\nPlease use /edit_schedule to edit the schedule instead.`);
      prevCommand.reset(chatId);
    } else {
      send("What question prompts would you like to use in this session? You may have more than one question, just be sure to separate them with a line break.");
      prevCommand.set(chatId, "schedule - add - questions", { time });
    }
  };

  continueConversation["schedule - add - questions"] = async ({ send, chatId }, msg, partial) => {
    const questions = msg.text.split("\n").filter(Boolean);
    send(`Okay, I'm creating a new session at ${formatScheduleInfo(partial.time, questions)}`);
    schedules.add(chatId, partial.time, questions);
    prevCommand.reset(chatId);
  };

  bot.onText(/\/edit_schedule/, async ({ send, chatId }) => {
    const userSchedules = await schedules.getUser(chatId);

    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      send(`Alright, you only have one schedule at ${formatScheduleInfo(time, questions)}\n\nPlease send a new time for this scheduled session.`);
      prevCommand.set(chatId, "schedule - edit - time", { time });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => time + ""));
      send("Which schedule would you like to edit?", withKeyboard(keyboard));
      prevCommand.set(chatId, "schedule - edit - select");
    }
  });

  continueConversation["schedule - edit - select"] = async ({ send, chatId }, msg) => {
    const time = parseTime(msg.text);
    const questions = await schedules.getQuestions(chatId, time);
    if (questions.length > 0) {
      send(`You have chosen to edit the schedule at ${formatScheduleInfo(time, questions)}\n\nPlease send a new time for this scheduled session.`, REMOVE_KEYBOARD);
      // TODO: implement "no change" option?
      prevCommand.set(chatId, "schedule - edit - time", { time });
    } else {
      send(`You do not have a session at ${formatTime(time)}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation["schedule - edit - time"] = async({ send, chatId }, msg, { time }) => {
    const newTime = parseTime(msg.text);
    const questions = await schedules.getQuestions(chatId, newTime);
    if (time !== newTime && questions.length > 0) {
      send(`You already have a session set for ${formatScheduleInfo(newTime, questions)}\n\nYou cannot have two journalling sessions scheduled for the same time.`);
      prevCommand.reset(chatId);
    } else {
      send("What question prompts would you like to use in this session? You may have more than one question, just be sure to separate them with a line break.");
      prevCommand.set(chatId, "schedule - edit - questions", { time, newTime });
    }
  };

  continueConversation["schedule - edit - questions"] = async({ send, chatId }, msg, { time, newTime }) => {
    const newQuestions = msg.text.split("\n").filter(Boolean);
    send(`Okay, your new session will be at ${formatScheduleInfo(newTime, newQuestions)}`);
    schedules.edit(chatId, time, newTime, newQuestions);
    prevCommand.reset(chatId);
  };

  bot.onText(/\/delete_schedule/, async ({ send, chatId }) => {
    const userSchedules = await schedules.getUser(chatId);

    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      send(`Alright, you only have one schedule at ${formatScheduleInfo(time, questions)}\n\nAre you sure you would like to delete this scheduled journalling session? Please send 'Yes' to confirm.`);
      prevCommand.set(chatId, "schedule - delete - confirm", { time });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => time + ""));
      send("Which schedule would you like to delete?", withKeyboard(keyboard));
      prevCommand.set(chatId, "schedule - delete - select");
    }
  });

  continueConversation["schedule - delete - select"] = async ({ send, chatId }, msg) => {
    const time = msg.text;
    const questions = await schedules.getQuestions(chatId, time);
    if (questions.length > 0) {
      send(`You have chosen to delete the schedule at ${formatScheduleInfo(time, questions)}\n\nAre you sure you would like to delete this session? Please send 'Yes' to confirm.`, REMOVE_KEYBOARD);
      prevCommand.set(chatId, "schedule - delete - confirm", { time });
    } else {
      send(`You do not have a session at ${formatTime(time)}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation["schedule - delete - confirm"] = async ({ send, chatId }, msg, { time }) => {
    if (msg.text === "Yes") {
      send("You have deleted your session.");
      schedules.delete(chatId, time);
    } else {
      send("Deleting cancelled.");
    }
    prevCommand.reset(chatId);
  };
}

module.exports = handleSchedules;
