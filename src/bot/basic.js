const db = require("../db");
const utils = require("../utils");
const { formatLevel } = require("../levels");
const errors = require("../db/errors");

const { clean, MARKDOWN } = utils.telegram;

function handleBasic({ bot }) {
  bot.onText(/\/start/, async ({ send, userId, chatId }, msg) => {
    await send(`Hello, ${msg.from.first_name}!`);

    const message = [
      "Welcome to LifeXP, a gamified journalling chatbot.\n",
      "I'm here to help you pen down your thoughts in a safe and convenient environment.\n",
      "Use /open to start a new journal entry.",
      "If you need a prompt to start off, let me know using /prompt.",
      "If you did something that you're proud of and want to celebrate it, try /ididathing.",
      "Finally, /close the journal entry and let your mind rest.\n",
      "I hope you have a meaningful journalling session.",
    ].join("\n");
    await send(message);

    try {
      await db.users.create(userId);
      const messageId = await bot.sendAndPin(chatId, formatLevel(1, 0));
      db.users.pinnedMessageId.set(userId, messageId);
    } catch (error) {
      if (error !== errors.USER_ALREADY_EXISTS) {
        console.error("error:", error);
      }
    }
  });

  bot.onText(/\/help/, ({ send }) => {
    const intro = [
      "Welcome to LifeXP, a gamified journalling chatbot.",
      "I'm here to help you pen down your thoughts in a safe and convenient environment.",
    ].join("\n");
    const journal = [
      "*Journal*",
      "/open - start a new journal entry",
      "/prompt - get a randomised prompt",
      "/echo - give yourself a prompt",
      "/ididathing - celebrate something you're proud of",
      "/close - end off the journal entry",
    ].join("\n");
    const browse = [
      "*Browse*",
      "/reflections - list all reflections",
      "/hashtags - list all hashtags",
      "/hashtag - browse conversations with a particular hashtag",
    ].join("\n");
    const game = [
      "*Game Features*",
      "/lifexp - show level and XP",
      "/achievements - show display cabinet of achievement badges",
      "/stats - show statistics",
    ].join("\n");
    const scheduled = [
      "*Scheduled Journalling Sessions*",
      "/manage_schedules",
      "/add_schedule",
      "/edit_schedule",
      "/delete_schedule",
    ].join("\n");
    const misc = [
      "/cancel - cancel your previous command",
    ].join("\n");
    const outro = [
      "I hope you have a meaningful journalling session. 😊",
    ].join("\n");

    const message = [intro, journal, browse, game, scheduled, misc, outro].join("\n\n");
    send(clean(message), MARKDOWN);
  });

  bot.onText(/\/cancel/, async ({ send, userId }) => {
    await db.users.prevCommand.reset(userId);
    send("The previous command has been cancelled.");
  });
}

module.exports = handleBasic;
