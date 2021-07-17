import { HandlerArguments } from "../../types/continueConversation";

import handleSession from "./session";
import handleAdd from "./add";
import handleEdit from "./edit";
import handleDelete from "./delete";
import handleManage from "./manage";

export default function handleSchedules({ bot, continueConversation }: HandlerArguments): void {
  handleSession({ bot, continueConversation });
  handleAdd({ bot, continueConversation });
  handleEdit({ bot, continueConversation });
  handleDelete({ bot, continueConversation });
  handleManage({ bot, continueConversation });
}
