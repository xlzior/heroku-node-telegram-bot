const telegram = require("./telegram");
const time = require("./time");
const pagination = require("./pagination");
const misc = require("./misc");

module.exports = {
  ...misc,
  telegram,
  time,
  pagination,
};
