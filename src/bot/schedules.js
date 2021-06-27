const db = require("../db");
const utils = require("../utils");

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
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
};

const formatScheduleInfo = (time, questions) => {
  return `${formatTime(time)} with the following ${questions.length} question(s):\n${questions.join("\n")}`;
};

function handleSchedules({ bot, continueConversation }) {
  bot.onText(/\/done/, async ({ userId, send }) => {
    const { command, partial } = await db.users.prevCommand.get(userId);
    if (command !== "scheduled") return;

    const { time, index } = partial;
    const questions = await db.schedules.getQuestions(userId, time);

    if (index < questions.length) {
      send(`${questions[index]}\n\n(when finished, send /done)`);
      db.users.prevCommand.set(userId, "scheduled", { time, index: index + 1 });
    } else {
      send("You've completed your scheduled journalling session. Good job!");
      db.users.prevCommand.reset(userId);
    }
  });

  bot.onText(/\/manage_schedules/, async ({ send, userId }) => {
    const userSchedules = await db.schedules.getUser(userId);

    if (userSchedules.length === 0) {
      send("Welcome to the scheduled journalling prompts feature. I can send you a fixed set of prompts every day at a time of your choosing. Use /add_schedule to get started.");
    } else {
      const schedulesDisplay = userSchedules
        .map(({ time, questions }) => `${formatTime(time)}: ${questions.length} questions`)
        .join("\n");
      await send(`You currently have the following schedules set:\n${schedulesDisplay}`);

      const commands = [
        "Use the following commands to add, edit or delete schedules:",
        "/add_schedule",
        "/edit_schedule",
        "/delete_schedule",
      ];
      await send(commands.join("\n"));
    }
  });

  bot.onText(/\/add_schedule/, ({ send, userId }) => {
    send("Nice, let's create a new scheduled journalling session! What time would you like to have this session every day? Please send a timestamp in 24-hour format (e.g. '2100' for 9pm).");
    db.users.prevCommand.set(userId, "schedule - add - time");
  });

  continueConversation["schedule - add - time"] = async ({ send, userId }, msg) => {
    const time = parseTime(msg.text);
    if (!time) {
      return send("Please send a valid timestamp in 24-hour format (e.g. '2100' for 9pm)");
    }
    // TODO: must be on the hour?

    const questions = await db.schedules.getQuestions(userId, time);
    if (questions.length > 0) {
      await send(`You already have a session set for ${formatScheduleInfo(time, questions)}`);
      await send("Please use /edit_schedule to edit the schedule instead.");
      db.users.prevCommand.reset(userId);
    } else {
      await send("What question prompts would you like to use in this session? You may have more than one question, just be sure to separate them with a line break.");
      db.users.prevCommand.set(userId, "schedule - add - questions", { time });
    }
  };

  continueConversation["schedule - add - questions"] = async ({ send, userId }, msg, partial) => {
    const questions = msg.text.split("\n").filter(Boolean);
    send(`Okay, I'm creating a new session at ${formatScheduleInfo(partial.time, questions)}`);
    db.schedules.add(userId, partial.time, questions);
    db.users.prevCommand.reset(userId);
  };

  bot.onText(/\/edit_schedule/, async ({ send, userId }) => {
    const userSchedules = await db.schedules.getUser(userId);

    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      await send(`Alright, you only have one schedule at ${formatScheduleInfo(time, questions)}`);
      await send("Please send a new time for this scheduled session.");
      db.users.prevCommand.set(userId, "schedule - edit - time", { time });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => time + ""));
      send("Which schedule would you like to edit?", withKeyboard(keyboard));
      db.users.prevCommand.set(userId, "schedule - edit - select");
    }
  });

  continueConversation["schedule - edit - select"] = async ({ send, userId }, msg) => {
    const time = parseTime(msg.text);
    const questions = await db.schedules.getQuestions(userId, time);
    if (questions.length > 0) {
      await send(`You have chosen to edit the schedule at ${formatScheduleInfo(time, questions)}`, REMOVE_KEYBOARD);
      await send("Please send a new time for this scheduled session.");
      // TODO: implement "no change" option?
      db.users.prevCommand.set(userId, "schedule - edit - time", { time });
    } else {
      send(`You do not have a session at ${formatTime(time)}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation["schedule - edit - time"] = async({ send, userId }, msg, { time }) => {
    const newTime = parseTime(msg.text);
    const questions = await db.schedules.getQuestions(userId, newTime);
    if (time !== newTime && questions.length > 0) {
      await send(`You already have a session set for ${formatScheduleInfo(newTime, questions)}`);
      await send("You cannot have two journalling sessions scheduled for the same time.");
      db.users.prevCommand.reset(userId);
    } else {
      await send("What question prompts would you like to use in this session? You may have more than one question, just be sure to separate them with a line break.");
      db.users.prevCommand.set(userId, "schedule - edit - questions", { time, newTime });
    }
  };

  continueConversation["schedule - edit - questions"] = async({ send, userId }, msg, { time, newTime }) => {
    const newQuestions = msg.text.split("\n").filter(Boolean);
    send(`Okay, your new session will be at ${formatScheduleInfo(newTime, newQuestions)}`);
    db.schedules.edit(userId, time, newTime, newQuestions);
    db.users.prevCommand.reset(userId);
  };

  bot.onText(/\/delete_schedule/, async ({ send, userId }) => {
    const userSchedules = await db.schedules.getUser(userId);

    if (userSchedules.length === 0) {
      send("You don't have any scheduled journalling sessions yet! Use /add_schedule to add a new one instead.");
    } else if (userSchedules.length === 1) {
      const { time, questions } = userSchedules[0];
      await send(`Alright, you only have one schedule at ${formatScheduleInfo(time, questions)}`);
      await send("Are you sure you would like to delete this scheduled journalling session? Please send 'Yes' to confirm.");
      db.users.prevCommand.set(userId, "schedule - delete - confirm", { time });
    } else {
      const keyboard = groupPairs(userSchedules.map(({ time }) => time + ""));
      send("Which schedule would you like to delete?", withKeyboard(keyboard));
      db.users.prevCommand.set(userId, "schedule - delete - select");
    }
  });

  continueConversation["schedule - delete - select"] = async ({ send, userId }, msg) => {
    const time = msg.text;
    const questions = await db.schedules.getQuestions(userId, time);
    if (questions.length > 0) {
      await send(`You have chosen to delete the schedule at ${formatScheduleInfo(time, questions)}`, REMOVE_KEYBOARD);
      await send("Are you sure you would like to delete this session? Please send 'Yes' to confirm.");
      db.users.prevCommand.set(userId, "schedule - delete - confirm", { time });
    } else {
      send(`You do not have a session at ${formatTime(time)}. Please send a valid time using the keyboard provided.`);
    }
  };

  continueConversation["schedule - delete - confirm"] = async ({ send, userId }, msg, { time }) => {
    if (msg.text === "Yes") {
      send("You have deleted your session.");
      db.schedules.delete(userId, time);
    } else {
      send("Deleting cancelled.");
    }
    db.users.prevCommand.reset(userId);
  };
}

module.exports = handleSchedules;
