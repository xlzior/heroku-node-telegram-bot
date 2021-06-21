const db = require("../db");
const utils = require("../utils");

const { MARKDOWN, REMOVE_KEYBOARD, clean, withKeyboard, groupPairs, replyTo } = utils.telegram;

function handleBrowse({ bot, continueConversation }) {
  bot.onText(/\/reflections/, async ({ send, userId }) => {
    const reflections = await db.reflections.getAll(userId);
    const message = reflections.map(utils.formatReflection).join("\n\n");
    send(clean(message), MARKDOWN);
  });

  bot.onText(/\/hashtags/, async ({ send, userId }) => {
    const hashtags = await db.hashtags.get(userId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    const message = "Showing the 5 most recent reflections for all hashtags\n\n" + hashtags.map(utils.formatHashtag(5)).join("\n\n");
    await send(clean(message), MARKDOWN);
    await send("Tip: Use /hashtag to view all reflections with a particular hashtag");
  });

  bot.onText(/\/hashtag(@lifexp_bot)?$/, async ({ send, userId }) => {
    const hashtags = await db.hashtags.get(userId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    db.users.prevCommand.set(userId, "hashtag");
    const keyboard = groupPairs(hashtags.map(({ hashtag }) => hashtag));
    send("Alright, which hashtag would you like to browse?", withKeyboard(keyboard));
  });

  continueConversation["hashtag"] = async ({ send, userId }, msg) => {
    const hashtags = await db.hashtags.get(userId);
    const hashtag = hashtags.find(({ hashtag }) => hashtag === msg.text);

    if (!hashtag) {
      return send(`Sorry, I don't recognise the hashtag '${msg.text}'. Please select a hashtag from the list.`);
    }

    const message = `Showing all reflections with the hashtag ${msg.text}\n\n` + utils.formatHashtag()(hashtag);
    send(clean(message), { ...MARKDOWN, ...REMOVE_KEYBOARD });
    db.users.prevCommand.reset(userId);
  };

  bot.onText(/\/goto(\d+)/, ({ send }, msg, match) => {
    send("The reflection started here!", replyTo(match[1]));
  });
}

module.exports = handleBrowse;
