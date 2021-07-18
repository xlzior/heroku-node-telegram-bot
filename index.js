require("dotenv").config();
const { handleRequests } = require("./web");

const bot = require("./built/src/bot");
handleRequests(bot);
