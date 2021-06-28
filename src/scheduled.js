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
    const botMsg = await bot.sendMessage(userId, `${questions[0]}\n\n(when finished, send /done)`);
    await db.reflections.open(userId, botMsg.message_id);
    await db.users.prevCommand.set(userId, "scheduled", { index: 1, time: now });
  }));

  server.close(process.exit);
};

main();
