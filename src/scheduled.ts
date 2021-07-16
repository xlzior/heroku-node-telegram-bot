import { DateTime } from "luxon";
import Bot = require("node-telegram-bot-api");
import env from "dotenv";

import { handleRequests, server } from "../web";
import * as db from "./db";
import { clean, MARKDOWN } from "./utils/telegram";
import { formatTime } from "./utils/time";

env.config();
const token = process.env.TOKEN;
const bot = new Bot(token);
handleRequests(bot);

/* MAIN */

const main = async () => {
  const now = formatTime(DateTime.utc());
  const schedules = await db.schedules.getTime(now);

  await Promise.all(schedules.map(async ({ user_id: chatId, questions }) => {
    const isOpen = await db.reflections.isOpen(chatId);
    if (!isOpen) { // don't interupt an ongoing session
      await bot.sendMessage(chatId, "It's time for your scheduled journalling session! Here's your first prompt:");
      const message = `*${questions[0]}*\n\n✅ /done with prompt\n⏭ /skip journalling session`;
      const botMsg = await bot.sendMessage(chatId, clean(message), MARKDOWN);
      await db.reflections.open(chatId, botMsg.message_id);
      await db.users.prevCommand.set(chatId, "scheduled", { index: 1, time: now });
    }
  }));

  server.close(process.exit);
};

main();
