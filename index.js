require("dotenv").config();
const { handleRequests } = require("./web");

const bot = require("./src/bot");
handleRequests(bot);
