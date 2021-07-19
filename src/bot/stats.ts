import * as db from "../db";
import { sum, emojiChart, telegram } from "../utils";
import { getBadgeImage, getBadgeLabel, BLANK_BADGE } from "../utils/achievements";
import { formatStats } from "../utils/levels";
import { HandlerArguments } from "../types/continueConversation";

export default function handleStats({ bot }: HandlerArguments): void {
  bot.handle(/\/lifexp/, async ({ chatId }) => {
    const { level, xp, streak } = await db.users.progress.get(chatId);
    bot.unpinChatMessage(chatId);
    const messageId = await bot.sendAndPin(chatId, formatStats(level, xp, streak));
    db.users.pinnedMessageId.set(chatId, messageId);
  });

  bot.handle(/\/stats/, async ({ send, chatId }) => {
    const { progress, idat, reflections, hashtags, emojis } = await db.stats.get(chatId);

    const game = [
      `*Level*: ${progress.level}`,
      `*Total XP*: ${progress.xp}`,
      `*Streak*: 🔥 ${progress.streak}`,
    ].join("\n");
    const journal = [
      `*Journal entries*: ${reflections.count}`,
      `Total: ${reflections.length.total} messages`,
      `Average: ${Math.round(reflections.length.average)} messages per reflection`,
      `Longest: ${reflections.length.maximum} messages`,
      "<i>(use /reflections to browse)</i>",
    ].join("\n");
    const hashtagsMessage = [
      `*Hashtags used*: ${hashtags.total}`,
      `${hashtags.unique} unique hashtags`,
      "<i>(use /hashtags to browse)</i>",
    ].join("\n");
    const idatMessage = [
      `*Great things done*: ${idat}`,
    ].join("\n");
    const emojisMessage = [
      `*Emojis used*: ${sum(emojis.map(({ count }) => count))}`,
      `Top 10 emojis:\n${emojiChart(emojis.slice(0, 10))}`,
    ].join("\n");
    const message = [game, journal, hashtagsMessage, idatMessage, emojisMessage].join("\n\n");
    send(telegram.clean(message), telegram.MARKDOWN);
  });

  bot.handle(/\/achievements/, async ({ send, chatId }) => {
    const achievements = await db.achievements.getAll(chatId);
    const achievementsCount = sum(achievements.map(a => a.level));

    if (achievementsCount === 0) {
      return send("Oh no! You haven't earned any achievements yet. Keep journalling to earn some!");
    }

    const photos = [];
    achievements.forEach(({ type, level }) => {
      for (let i = 3; i >= 1; i--) {
        photos.push({
          type: "photo",
          media: i <= level ? getBadgeImage(type, i) : BLANK_BADGE,
          caption: i <= level ? getBadgeLabel(type, i) : "",
        });
      }
    });
    await send("Resending your achievements...");
    await bot.sendPhotos(chatId, photos);
    await send("Tip: View the chat's 'shared media' to see a display cabinet of all your achievement badges!");
  });
}
