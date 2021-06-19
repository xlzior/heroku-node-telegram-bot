const express = require("express");
const bodyParser = require("body-parser");

const packageInfo = require("./package.json");

const app = express();
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.json({ version: packageInfo.version });
});

const server = app.listen(process.env.PORT, "0.0.0.0", () => {
  const host = server.address().address;
  const port = server.address().port;
  console.info(`Web server started at http://${host}:${port}`);
});

module.exports = {
  fn: bot => {
    app.post("/" + bot.token, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  },
  server,
};
