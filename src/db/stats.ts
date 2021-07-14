import utils = require("../utils");

import users = require("./users");
import reflections = require("./reflections");
import hashtagsDb = require("./hashtags");
import emojisDb = require("./emojis");

export const get = async chatId => {
  const progress = users.progress.get(chatId);
  const idat = users.idat.get(chatId);
  const reflectionsCount = reflections.getCount(chatId);
  const reflectionLengths = reflections.getLengths(chatId);
  const hashtagsTotalCount = hashtagsDb.getTotalCount(chatId);
  const hashtagsUniqueCount = hashtagsDb.getUniqueCount(chatId);
  const emojis = emojisDb.getUser(chatId);

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
    emojis: await emojis,
  };
};
