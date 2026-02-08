import TelegramBot from "node-telegram-bot-api";
import { catalogHandler } from "./catalog/catalog.handler";
import { MENU_TEXTS } from "../texts/menu.texts";
import { removeNavigationMessage } from "../utils/removeNavigationMessage";
import { setChatState } from "../state/chat.state";
import { clearChatMessages } from "../utils/clearChatMessages";
import { SECTION } from "../types/navigation";
import { getUserState, setUserState } from "../state/user.state";
import { deleteUserInputHandler } from "./users/deleteUser.handler";
import { pageInputHandler } from "../utils/pagination";
import { editUserInputHandler } from "./users/editUser.handler";

export function registerMessages(bot: TelegramBot) {
	bot.on("message", async (msg) => {
		const chatId = msg.chat.id;
		const text = msg.text;

		if (!text) return;

		const userState = getUserState(chatId);

    if (userState.mode === "add_user") {
      return;
    }

		if (userState.mode === "delete_user") {
			await deleteUserInputHandler(bot, chatId, text);
			return;
		}

    if (userState.mode === "edit_user") {
      await editUserInputHandler(bot, chatId, text);
      return;
    }

		if (userState.mode === "await_page_number") {
			await pageInputHandler(bot, chatId, text);
			setUserState(chatId, { mode: "idle" });
			return;
		}

		switch (text) {
			case MENU_TEXTS.CATALOG:
				await clearChatMessages(bot, chatId);
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
          replyMessageId: msg.message_id,
        });
				await catalogHandler(bot, chatId);
				break;

			case MENU_TEXTS.ORDERS:
				await clearChatMessages(bot, chatId);
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
          replyMessageId: msg.message_id,
        });
        //TODO add logic for open orders menu
				break;

			case MENU_TEXTS.CART:
				await clearChatMessages(bot, chatId);
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
					section: SECTION.CART,
          replyMessageId: msg.message_id,
        });
        //TODO add logic for open orders menu
				break;

			default: break;
		}
	});
}
