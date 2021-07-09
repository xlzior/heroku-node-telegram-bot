const Bot = require("node-telegram-bot-api");

const { getBadgeImage, getBadgeLabel, checkForNewBadge } = require("../achievements");
const { formatStats } = require("../levels");
const db = require("../db");
const errors = require("../db/errors");
const utils = require("../utils");

// refactor out commonly used functionality
// e.g. bot.sendMessage(msg.chat.id, message, options) becomes send(message, options)
const generateShortcuts = (thisBot, msg) => ({
  userId: msg.from.id,
  chatId: msg.chat.id,
  send (...args) { return thisBot.sendMessage(msg.chat.id, ...args); },
});

Bot.prototype.originalOnText = Bot.prototype.onText;

Bot.prototype.onText = function(regex, callback) {
  const botReference = this;
  return this.originalOnText(regex, function(msg, match) {
    const shortcuts = generateShortcuts(botReference, msg);
    callback(shortcuts, msg, match);
  });
};

Bot.prototype.onMessage = function(callback) {
  const botReference = this;
  return this.on("message", function(msg) {
    const shortcuts = generateShortcuts(botReference, msg);
    callback(shortcuts, msg);
  });
};

Bot.prototype.notifyXP = async function(chatId, type, xpData) {
  const { level, levelledUp, additionalXP, xp, streak, pinnedMessageId } = xpData;
  await this.sendMessage(chatId, `You earned ${additionalXP} XP for ${type}!`);
  if (levelledUp) await this.sendMessage(chatId, `You levelled up! You are now Level ${level}.`);
  await this.editMessageText(formatStats(level, xp, streak), {
    chat_id: chatId,
    message_id: pinnedMessageId,
  });
};

Bot.prototype.notifyBadge = function(chatId, type, badgeLevel) {
  const badgeImage = getBadgeImage(type, badgeLevel);
  return this.sendPhoto(chatId, badgeImage,
    { caption: `New Achievement! ${getBadgeLabel(type, badgeLevel)}` });
};

Bot.prototype.notifyBadges = async function(chatId, type, previousLevel, currentLevel) {
  for (let i = previousLevel + 1; i <= currentLevel; i++) {
    await this.notifyBadge(chatId, type, i);
  }
};

Bot.prototype.sendAndPin = async function(chatId, message) {
  const botMsg = await this.sendMessage(chatId, message);
  this.pinChatMessage(chatId, botMsg.message_id);
  return botMsg.message_id;
};

const MAX_PER_MEDIA_GROUP = 9;
// Telegram media groups allow up to 10 photos in one message
// but since achievements come in groups of 3, groups of 9 are more suitable

// depending on the number of photos, send the appropriate number of media groups
Bot.prototype.sendPhotos = async function(chatId, photos) {
  if (photos.length === 1) { // send an individual photo
    const { media, caption } = photos[0];
    await this.sendPhoto(chatId, media, { caption });
  } else if (photos.length <= MAX_PER_MEDIA_GROUP) { // send a media group
    await this.sendMediaGroup(chatId, photos);
  } else { // send multiple media groups
    await this.sendMediaGroup(chatId, photos.slice(0, MAX_PER_MEDIA_GROUP)); // send the first batch
    await this.sendPhotos(chatId, photos.slice(MAX_PER_MEDIA_GROUP));        // recurse for the rest
  }
};

Bot.prototype.sendClosingStats = async function({ send, chatId }, messageId, name, date) {
  // emojis
  const emojis = await db.emojis.getCurrent(chatId);
  const emojiCounts = emojis.map(({ count }) => count);
  if (emojis.length >= 2 && utils.sum(emojiCounts) >= 5) {
    await send(`You used these emojis in this entry:\n\n${utils.emojiChart(emojis)}`);
  }

  // XP
  const convoLength = await db.reflections.close(chatId, messageId, name)
    .catch(error => {
      if (error === errors.NO_REFLECTION_OPEN) {
        send("You have not started a reflection. Use /open to start a new reflection");
      } else {
        console.error("error:", error);
      }
    });

  await db.users.progress.updateStreak(chatId, date);
  const xpData = await db.users.progress.addXP(chatId, convoLength);
  await this.notifyXP(chatId, "this reflection", xpData);

  // achievements
  const stats = [
    { type: "convoLength", value: convoLength },
    { type: "reflections", value: await db.reflections.getCount(chatId) },
    { type: "hashtags", value: await db.hashtags.getTotalCount(chatId) },
    { type: "emojis", value: await db.emojis.getCount(chatId) },
  ];

  const achievements = await db.achievements.getAll(chatId);

  stats.forEach(async ({ type, value }) => {
    const previousAchievement = achievements.find(elem => elem.type === type);
    const previousLevel = previousAchievement ? previousAchievement.level : 0;
    const { hasNewBadge, currentLevel } = checkForNewBadge(type, previousLevel, value);
    if (hasNewBadge) {
      await this.notifyBadges(chatId, type, previousLevel, currentLevel);
      db.achievements.update(chatId, type, currentLevel);
    }
  });
};

module.exports = Bot;
