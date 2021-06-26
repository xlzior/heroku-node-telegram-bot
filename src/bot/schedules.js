const db = require("../db");
const utils = require("../utils");

const { groupPairs, withKeyboard } = utils.telegram;

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
  continueConversation["scheduled"] = async ({ userId, send }, msg, { time, index }) => {
    const questions = await db.schedules.getQuestions(userId, time);

    if (index < questions.length) {
      send(questions[index]);
      db.users.prevCommand.set(userId, "scheduled", { time, index: index + 1 });
    } else {
      send("You've completed your scheduled journalling session. Good job!");
      db.users.prevCommand.reset(userId);
    }
  };

  bot.onText(/\/manage_schedules/, async ({ send, userId }) => {
    const userSchedules = await db.schedules.getUser(userId);
    if (userSchedules.length === 0) {
      send("Welcome to the scheduled journalling prompts feature. I can send you a fixed set of prompts every day at a time of your choosing. Use /add_schedule to get started.");
    } else {
      const schedulesDisplay = userSchedules
        .map(({ time, questions }) => `${formatTime(time)}: ${questions.length} questions`)
        .join("\n");
      send(`You currently have the following schedules set:\n${schedulesDisplay}`);

      const commands = [
        "Use the following commands to add, edit or delete schedules:",
        "/add_schedule",
        "/edit_schedule",
        "/delete_schedule",
      ];
      send(commands.join("\n"));
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
      send(`You already have a session set for ${formatScheduleInfo(time, questions)}.`);
      send("Please use /edit_schedule to edit the schedule instead.");
      db.users.prevCommand.reset(userId);
    } else {
      await send("What question prompts would you like to use in this session? You may have more than one question, just be sure to separate them with a line break.");
      db.users.prevCommand.set(userId, "schedule - add - questions", { time });
    }
  };

  continueConversation["schedule - add - questions"] = async ({ send, userId }, msg, partial) => {
    const questions = msg.text.split("\n").filter(Boolean);
    send(`Okay, I'm creating a new session at ${formatScheduleInfo(partial.time, questions)}.`);
    db.schedules.add(userId, partial.time, questions);
    db.users.prevCommand.reset(userId);
  };
}

module.exports = handleSchedules;
