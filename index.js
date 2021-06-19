require("dotenv").config();
const { fn } = require("./web");

const bot = require("./src/bot");
fn(bot);
