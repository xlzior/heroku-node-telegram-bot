require("dotenv").config();
const { fn } = require('./web');

var bot = require('./bot');
fn(bot);
