import TelegramBot from "node-telegram-bot-api";
import { catalogHandler } from "./catalog/catalog.handler";
import { MENU_TEXTS } from "../texts/menu.texts";
import { removeNavigationMessage } from "../utils/removeNavigationMessage";
import {setChatState} from "../state/chat.state";

export function registerMessages(bot: TelegramBot) {
	bot.on("message", async (msg) => {
		const chatId = msg.chat.id;
		const text = msg.text;

		if (!text) return;

		switch (text) {
			case MENU_TEXTS.CATALOG:
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
          replyMessageId: msg.message_id,
        });
				await catalogHandler(bot, chatId);
				break;

			case MENU_TEXTS.ORDERS:
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
          replyMessageId: msg.message_id,
        });
        //TODO add logic for open orders menu
				break;

			case MENU_TEXTS.CART:
				await removeNavigationMessage(bot, chatId);
        setChatState(chatId, {
          replyMessageId: msg.message_id,
        });
        //TODO add logic for open orders menu
				break;

			default: break;
		}
	});
}
