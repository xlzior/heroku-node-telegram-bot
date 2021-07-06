const reflectionsDb = require("../db/reflections");
const hashtagsDb = require("../db/hashtags");

const { clean, MARKDOWN, withInlineKeyboard } = require("./telegram");
const { formatReflection } = require("./misc");

const REFLECTIONS_PER_PAGE = 5;
const pageToOffset = page => 5 * (page - 1);
const countToNumPages = count => Math.ceil(count / REFLECTIONS_PER_PAGE);

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
  getEntities,
  getNoEntitiesMessage,
  getCount,
) => async (chatId, ...data) => {
  const currentPage = data[data.length - 1];

  // entities
  const entities = await getEntities(chatId, data);
  if (entities.length === 0) {
    return { error: true, message: getNoEntitiesMessage(chatId, data), options: {} };
  }
  const list = entities.map(formatReflection).join("\n\n");

  // pagination
  const lastPage = await getCount(chatId, data).then(countToNumPages);
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
  (chatId, data) => reflectionsDb.get(chatId, 5, pageToOffset(data[0])),
  () => "You do not have any reflections. Use /open to start a new journal entry",
  chatId => reflectionsDb.getCount(chatId),
);

// callback_data: `hashtag - ${hashtag} - ${pageNumber}`
// data = [hashtag, pageNumber]
const generateHashtagList = generateList(
  (chatId, data) => `hashtag - ${data[0]}`,
  (chatId, data) => hashtagsDb.get(chatId, data[0], 5, pageToOffset(data[1])),
  (chatId, data) => `Sorry, I don't recognise the hashtag '${data[0]}'. Please select a hashtag from the list.`,
  (chatId, data) => hashtagsDb.getCount(chatId, data[0]),
);

module.exports = {
  generateReflectionsList,
  generateHashtagList,
};
