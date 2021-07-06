const reflectionsDb = require("../db/reflections");
const hashtagsDb = require("../db/hashtags");

const { clean, MARKDOWN, withInlineKeyboard } = require("./telegram");
const { formatReflection, formatHashtag } = require("./misc");

const pageToOffset = perPage => page => perPage * (page - 1);
const countToNumPages = perPage => count => Math.ceil(count / perPage);

const generatePagination = type => (currentPage, lastPage) => {
  if (lastPage === 1) return null;

  const first = { text: "<< 1", callback_data: `${type} - ${1}` };
  const prev = { text: `< ${currentPage - 1}`, callback_data: `${type} - ${currentPage - 1}` };
  const current = { text: currentPage, callback_data: `${type} - current` };
  const next = { text: `${currentPage + 1} >`, callback_data: `${type} - ${currentPage + 1}` };
  const last = { text: `${lastPage} >>`, callback_data: `${type} - ${lastPage}` };

  const result = [current];

  if (currentPage > 1) result.unshift(prev);
  if (currentPage > 2) result.unshift(first);
  if (currentPage < lastPage) result.push(next);
  if (currentPage < lastPage - 1) result.push(last);

  return [result.filter(Boolean)];
};

const generateList = (
  getPaginationType,
  perPage,
  getEntities,
  getNoEntitiesMessage,
  formatEntities,
  getCount,
) => async (chatId, ...data) => {
  const currentPage = data[data.length - 1];

  // entities
  const entities = await getEntities(chatId, data, perPage);
  if (entities.length === 0) {
    return { error: true, message: getNoEntitiesMessage(chatId, data), options: {} };
  }
  const list = formatEntities(entities);

  // pagination
  const lastPage = await getCount(chatId, data).then(countToNumPages(perPage));
  const keyboard = generatePagination(getPaginationType(chatId, data))(currentPage, lastPage);

  // assemble the message
  const message = [
    clean(list),
    `Page ${currentPage} of ${lastPage}`,
  ].join("\n\n");
  const options = { ...MARKDOWN, ...withInlineKeyboard(keyboard) };
  return { message, options };
};

// callback_data: `reflections - ${pageNumber}`
// data = [pageNumber]
const generateReflectionsList = generateList(
  () => "reflections",
  5,
  (chatId, data, perPage) => reflectionsDb.get(
    chatId, perPage, pageToOffset(perPage)(data[0])),
  () => "You do not have any reflections. Use /open to start a new journal entry",
  reflections => reflections.map(formatReflection).join("\n\n"),
  chatId => reflectionsDb.getCount(chatId),
);

// callback_data: `hashtag - ${hashtag} - ${pageNumber}`
// data = [hashtag, pageNumber]
const generateHashtagList = generateList(
  (chatId, data) => `hashtag - ${data[0]}`,
  5,
  (chatId, data, perPage) => hashtagsDb.get(
    chatId, data[0], perPage, pageToOffset(perPage)(data[1])),
  (chatId, data) => `Sorry, I don't recognise the hashtag '${data[0]}'. Please select a hashtag from the list.`,
  reflections => reflections.map(formatReflection).join("\n\n"),
  (chatId, data) => hashtagsDb.getCount(chatId, data[0]),
);

// callback_data: `hashtags - ${pageNumber}`
// data = [pageNumber]
const generateHashtagsList = generateList(
  () => "hashtags",
  25,
  (chatId, data, perPage) => hashtagsDb.getAll(
    chatId, perPage, pageToOffset(perPage)(data[0])),
  () => "You have no hashtags saved. /open a reflection and use hashtags to categorise your entries.",
  hashtags => hashtags.map(formatHashtag).join("\n"),
  chatId => hashtagsDb.getUniqueCount(chatId),
);

module.exports = {
  generateReflectionsList,
  generateHashtagList,
  generateHashtagsList,
};
