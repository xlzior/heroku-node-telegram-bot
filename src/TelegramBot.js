const Bot = require('node-telegram-bot-api');

const { getBadgeImage, getBadgeLabel } = require('./achievements');
const { formatLevel } = require('./levels');

Bot.prototype.notifyXP = async function(chatId, type, xpData) {
  const { level, levelledUp, additionalXP, xp, pinnedMessageId } = xpData;
  await this.sendMessage(chatId, `You earned ${additionalXP} XP for ${type}!`);
  levelledUp && await this.sendMessage(chatId, `You levelled up! You are now Level ${level}.`);
  await this.editMessageText(formatLevel(level, xp), {
    chat_id: chatId,
    message_id: pinnedMessageId,
  })
}

Bot.prototype.notifyBadge = function(chatId, type, badgeLevel) {
  const badgeImage = getBadgeImage(type, badgeLevel);
  return this.sendPhoto(chatId, badgeImage,
    { caption: `New Achievement! ${getBadgeLabel(type, badgeLevel)}` });
}

Bot.prototype.sendAndPin = async function(chatId, message) {
  const botMsg = await this.sendMessage(chatId, message)
  this.pinChatMessage(chatId, botMsg.message_id);
  return botMsg.message_id;
}

// depending on the number of photos, send the appropriate number of media groups
Bot.prototype.sendPhotos = async function(chatId, photos) {
  if (photos.length === 1) { // send an individual photo
    const { media, caption } = photos[0]
    await this.sendPhoto(chatId, media, { caption })
  } else if (photos.length <= 10) { // send a media group
    await this.sendMediaGroup(chatId, photos);
  } else { // send multiple media groups
    await this.sendMediaGroup(chatId, photos.slice(0, 10)); // send the first 10
    await this.sendPhotos(chatId, photos.slice(10));            // recurse for the rest
  }
}

module.exports = Bot;