const utils = require("../utils");

const users = require("./users");
const reflections = require("./reflections");
const hashtagsDb = require("./hashtags");

const get = async chatId => {
  const progress = users.progress.get(chatId);
  const idat = users.idat.get(chatId);
  const reflectionsCount = reflections.getCount(chatId);
  const reflectionLengths = reflections.getLengths(chatId);
  const hashtagsTotalCount = hashtagsDb.getTotalCount(chatId);
  const hashtagsUniqueCount = hashtagsDb.getUniqueCount(chatId);

  return {
    progress: await progress,
    idat: await idat,
    reflections: {
      count: await reflectionsCount,
      length: {
        total: utils.sum(await reflectionLengths),
        average: utils.average(await reflectionLengths),
        maximum: utils.max(await reflectionLengths),
      },
    },
    hashtags: {
      total: await hashtagsTotalCount,
      unique: await hashtagsUniqueCount,
    },
  };
};

module.exports = {
  get,
};
