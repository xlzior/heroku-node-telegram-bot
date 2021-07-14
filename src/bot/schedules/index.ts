import handleSession = require("./session");
import handleAdd = require("./add");
import handleEdit = require("./edit");
import handleDelete = require("./delete");
import handleManage = require("./manage");

function handleSchedules(bot, continueConversation) {
  handleSession(bot, continueConversation);
  handleAdd(bot, continueConversation);
  handleEdit(bot, continueConversation);
  handleDelete(bot, continueConversation);
  handleManage(bot, continueConversation);
}

export = handleSchedules;
