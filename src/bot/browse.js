const db = require("../db");
const utils = require("../utils");

const {
  clean, MARKDOWN,
  groupPairs, withKeyboard, withInlineKeyboard, REMOVE_KEYBOARD,
  replyTo,
} = utils.telegram;

const REFLECTIONS_LIMIT = 5;

const pageToOffset = page => 5 * (page - 1);

const countToNumPages = count => Math.ceil(count / REFLECTIONS_LIMIT);

const process = buttonsList => {
  return [buttonsList.filter(Boolean)];
};

const generatePagination = (currentPage, lastPage) => {
  if (lastPage === 1) return null;

  const first = { text: "<< 1", callback_data: 1 };
  const prev = { text: `< ${currentPage - 1}`, callback_data: currentPage - 1 };
  const current = { text: currentPage, callback_data: "current" };
  const next = { text: `${currentPage + 1} >`, callback_data: currentPage + 1 };
  const last = { text: `${lastPage} >>`, callback_data: lastPage };

  const result = [current];

  if (currentPage > 1) result.unshift(prev);
  if (currentPage > 2) result.unshift(first);
  if (currentPage < lastPage) result.push(next);
  if (currentPage < lastPage - 1) result.push(last);

  return process(result);
};

const generateReflectionsList = async (userId, currentPage) => {
  // reflections
  const reflections = await db.reflections.get(
    userId, REFLECTIONS_LIMIT, pageToOffset(currentPage));
  const reflectionsList = reflections.map(utils.formatReflection).join("\n\n");

  // pagination
  const reflectionsCount = await db.reflections.getCount(userId);
  const lastPage = countToNumPages(reflectionsCount);
  const keyboard = generatePagination(currentPage, lastPage);

  const message = `${clean(reflectionsList)}\n\nPage ${currentPage} of ${lastPage}`;
  const options = { ...MARKDOWN, ...withInlineKeyboard(keyboard) };
  return { message, options };
};

function handleBrowse({ bot, continueConversation }) {
  bot.onText(/\/reflections/, async ({ send, userId }) => {
    const { message, options } = await generateReflectionsList(userId, 1);
    send(message, options);
  });

  bot.on("callback_query", async ({ id, from, message: msg, data }) => {
    if (data !== "current") {
      const { message, options } = await generateReflectionsList(from.id, parseInt(data));
      bot.editMessageText(message, {
        ...options,
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
    }
    bot.answerCallbackQuery(id);
  });

  bot.onText(/\/hashtags/, async ({ send, userId }) => {
    const hashtags = await db.hashtags.getAll(userId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    const message = `You've used these hashtags in your reflections:
    \n${hashtags.map(utils.formatHashtag(0)).join("")}`;
    await send(clean(message), MARKDOWN);
    await send("Use /hashtag to view all reflections with a particular hashtag");
  });

  bot.onText(/\/hashtag(@lifexp_bot)?$/, async ({ send, userId }) => {
    const hashtags = await db.hashtags.getAll(userId);
    if (hashtags.length === 0) {
      return send("You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.");
    }
    db.users.prevCommand.set(userId, "hashtag");
    const keyboard = groupPairs(hashtags.map(({ hashtag }) => hashtag));
    send("Alright, which hashtag would you like to browse?", withKeyboard(keyboard));
  });

  continueConversation["hashtag"] = async ({ send, userId }, msg) => {
    const hashtag = await db.hashtags.get(userId, msg.text);

    if (!hashtag) {
      return send(`Sorry, I don't recognise the hashtag '${msg.text}'. Please select a hashtag from the list.`);
    }

    const message = `Showing all reflections with the hashtag ${msg.text}
    \n${utils.formatHashtag()(hashtag)}`;
    send(clean(message), { ...MARKDOWN, ...REMOVE_KEYBOARD });
    db.users.prevCommand.reset(userId);
  };

  bot.onText(/\/goto(\d+)/, ({ send }, msg, match) => {
    send("The reflection started here!", replyTo(match[1]));
  });
}

module.exports = handleBrowse;
