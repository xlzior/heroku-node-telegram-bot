import handleSession from "./session";
import handleAdd from "./add";
import handleEdit from "./edit";
import handleDelete from "./delete";
import handleManage from "./manage";

export default function handleSchedules(bot, continueConversation) {
  handleSession(bot, continueConversation);
  handleAdd(bot, continueConversation);
  handleEdit(bot, continueConversation);
  handleDelete(bot, continueConversation);
  handleManage(bot, continueConversation);
}
