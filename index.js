require("dotenv").config();
const { fn } = require('./web');

var bot = require('./src/bot');
fn(bot);
