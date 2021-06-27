const db = require("../db");
const { formatLevel } = require("../levels");
const { getBadgeImage, getBadgeLabel, BLANK_BADGE } = require("../achievements");

const utils = require("../utils");

function handleStats({ bot }) {
  bot.onText(/\/lifexp/, async ({ chatId, userId }) => {
    const { level, xp, pinnedMessageId } = await db.users.progress.get(userId);
    bot.unpinChatMessage(chatId, { message_id: pinnedMessageId });
    const messageId = await bot.sendAndPin(chatId, formatLevel(level, xp));
    db.users.pinnedMessageId.set(userId, messageId);
  });

  bot.onText(/\/stats/, async ({ send, userId }) => {
    const { progress, idat, reflections, hashtags } = await db.stats.get(userId);

    const statsDisplay = [
      `*Level*: ${progress.level}\n*Total XP*: ${progress.xp}`,
      `*Journal entries*: ${reflections.count}
      Total: ${reflections.length.total} messages
      Average: ${Math.round(reflections.length.average)} messages per reflection
      Longest: ${reflections.length.maximum} messages`,
      `*Hashtags used*: ${hashtags.total}
      ${hashtags.unique} unique hashtags
      <i>(use /hashtags to browse)</i>`,
      `*Great things done*: ${idat}`,
    ];
    const message = statsDisplay.join("\n\n");
    send(utils.telegram.clean(message), utils.telegram.MARKDOWN);
  });

  bot.onText(/\/achievements/, async ({ send, userId, chatId }) => {
    const achievements = await db.achievements.getAll(userId);
    const achievementsCount = utils.sum(Object.values(achievements));

    // KIV: delete all previous badges sent? so that it's not so repetitive

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

module.exports = handleStats;