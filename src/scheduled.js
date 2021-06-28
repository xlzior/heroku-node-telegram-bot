require("dotenv").config();
const Bot = require("node-telegram-bot-api");

const { handleRequests, server } = require("../web");
const db = require("./db");

const token = process.env.TOKEN;
const bot = new Bot(token);
handleRequests(bot);

/* MAIN */

const main = async () => {
  const now = (new Date()).getHours() * 100;
  const schedules = await db.schedules.getTime(now);

  await Promise.all(schedules.map(async ({ user_id: userId, questions }) => {
    if (!db.reflections.isOpen(userId)) { // don't interupt an ongoing session
      const message = [
        "It's time for your scheduled journalling session!",
        `Here's your first prompt: ${questions[0]}`,
        "When finished, send /done. You may use /skip to skip this journalling session.",
      ].join("\n\n");
      const botMsg = await bot.sendMessage(userId, message);
      await db.reflections.open(userId, botMsg.message_id);
      await db.users.prevCommand.set(userId, "scheduled", { index: 1, time: now });
    }
  }));

  server.close(process.exit);
};

main();
