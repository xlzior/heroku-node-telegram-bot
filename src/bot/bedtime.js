const { DateTime } = require("luxon");

const { prevCommand, sleep, progress } = require("../db").users;

// continueConversation
const BEDTIME = "set bedtime";
const WAKEUP = "set wakeup time";

// calculateXP
const MAX_XP = 100;
const XP_DECAY_PER_MIN = 2;
const EARLY_MINS = 60; // full XP still given if you are EARLY_MINS earlier than goal
const GRACE_PERIOD_MINS = 10; // full XP given up to GRACE_PERIOD minutes after goal

const HALF_DAY_IN_MINUTES = 12 * 60;
const FULL_DAY_IN_MINUTES = 24 * 60;
const calculateDeltaInMinutes = (a, b) => {
  const rawDelta = a.diff(b, "minutes").values.minutes;
  if (rawDelta < -HALF_DAY_IN_MINUTES) return rawDelta + FULL_DAY_IN_MINUTES;
  if (rawDelta > HALF_DAY_IN_MINUTES) return rawDelta - FULL_DAY_IN_MINUTES;
  return rawDelta;
};
// output ranges from -HALF_DAY_IN_MINUTES to HALF_DAY_IN_MINUTES i.e. -720 to 720

const calculateXP = (goal, now) => {
  const delta = calculateDeltaInMinutes(goal, now);
  if (delta < -EARLY_MINS) {
    return { xp: 0, message: "You're really early 😳 Try not to deviate too much from your goal!" };
  } else if (delta < 0) {
    return { xp: MAX_XP, message: "You're a bit early, but that's okay!" };
  } else if (delta < GRACE_PERIOD_MINS) {
    return { xp: MAX_XP, message: "Nice, you hit your goal!" };
  }

  const xp = Math.round(MAX_XP - XP_DECAY_PER_MIN * (delta - GRACE_PERIOD_MINS));
  if (xp > 0) {
    return { xp, message: "You're a bit late, but that's okay!" };
  }
  return { xp: 0, message: "You're too late 😔 Try not to deviate too much from your goal!" };
};

function handleBedtime({ bot, continueConversation }) {
  bot.onText(/\/set_bedtime/, async ({ send, chatId }) => {
    await send("Welcome to the bedtime feature. I can give you XP for going to sleep and waking up on time.");
    const bedtime = await sleep.getBedtime(chatId);
    const wakeup = await sleep.getWakeup(chatId);

    if (bedtime || wakeup) {
      await send([
        "Your current settings are as follows:",
        `Bedtime: ${bedtime.toFormat("h:mma")}`,
        `Wake up time: ${wakeup.toFormat("h:mma")}`,
      ].join("\n"));
    }
    send("What time do you aim to go to sleep? Please send a time in 12-hour format (e.g. 11:00pm)");
    prevCommand.set(chatId, BEDTIME);
  });

  continueConversation[BEDTIME] = async ({ send, chatId }, msg) => {
    const bedtime = DateTime.fromFormat(msg.text, "h:mma");
    if (bedtime.invalid) {
      send("Please send a valid time in 12-hour format (e.g. 11:00pm)");
    } else {
      send("What time do you aim to wake up? Please send a time in 12-hour format (e.g. 8:00am)");
      prevCommand.set(chatId, WAKEUP, { bedtime });
    }
  };

  continueConversation[WAKEUP] = async ({ send, chatId }, msg, { bedtime: bedtimeISO }) => {
    const bedtime = DateTime.fromISO(bedtimeISO);
    const wakeupTime = DateTime.fromFormat(msg.text, "h:mma");
    if (wakeupTime.invalid) {
      send("Please send a valid time in 12-hour format (e.g. 8:00am)");
    } else {
      send(`Alright! Try to go to sleep at ${bedtime.toFormat("h:mma")} and wake up at ${wakeupTime.toFormat("h:mma")}. Send /good_night when you go to sleep, and /good_morning when you wake up.`);
      sleep.set(chatId, bedtime.toFormat("HH:mm:ss"), wakeupTime.toFormat("HH:mm:ss"));
      prevCommand.reset(chatId);
    }
  };

  bot.onText(/\/good_morning/, async ({ send, chatId }, msg) => {
    await send("Good morning!");
    const now = DateTime.fromSeconds(msg.date);

    const wakeupGoal = await sleep.getWakeup(chatId);
    if (wakeupGoal) {
      const { xp, message } = calculateXP(now, wakeupGoal);
      await send(message);
      if (xp > 0) {
        const xpData = await progress.addXP(chatId, xp);
        await bot.notifyXP(chatId, "waking up on time", xpData);
      }
    } else {
      send("You haven't set your bedtime goals yet! Use /set_bedtime to get started");
    }
  });

  bot.onText(/\/good_night/, async ({ send, chatId }, msg) => {
    await send("Goodnight! Sweet dreams~");
    const now = DateTime.fromSeconds(msg.date);

    const bedtimeGoal = await sleep.getBedtime(chatId);
    if (bedtimeGoal) {
      const { xp, message } = calculateXP(now, bedtimeGoal);
      await send(message);
      if (xp > 0) {
        const xpData = await progress.addXP(chatId, xp);
        await bot.notifyXP(chatId, "going to sleep on time", xpData);
      }
    } else {
      send("You haven't set your bedtime goals yet! Use /set_bedtime to get started");
    }
  });
}

module.exports = handleBedtime;
