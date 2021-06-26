require("dotenv").config();
const Bot = require("node-telegram-bot-api");

const { fn, server } = require("../web");
const db = require("./db");

const token = process.env.TOKEN;

let bot;
if(process.env.NODE_ENV === "production") {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.info(`Bot server started in ${process.env.NODE_ENV} mode`);

/* MAIN */

const main = async () => {
  const now = (new Date()).getHours() * 100;
  const schedules = await db.schedules.getTime(now);

  await Promise.all(schedules.map(async ({ user_id: userId, questions }) => {
    await bot.sendMessage(userId, questions[0]);
    await db.users.prevCommand.set(userId, "scheduled", { index: 1, time: now });
  }));

  server.close(process.exit);
};

main();

fn(bot);
