const handleAdd = require("./add");
const handleEdit = require("./edit");
const handleDelete = require("./delete");
const handleManage = require("./manage");

function handleSchedules({ bot, continueConversation }) {
  handleAdd({ bot, continueConversation });
  handleEdit({ bot, continueConversation });
  handleDelete({ bot, continueConversation });
  handleManage({ bot, continueConversation });
}

module.exports = handleSchedules;
