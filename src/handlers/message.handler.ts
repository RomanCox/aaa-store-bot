import TelegramBot from "node-telegram-bot-api";
import { catalogHandler } from "./catalog/catalog.handler";
import { MENU_TEXTS } from "../texts/menu.texts";
import { removeNavigationMessage } from "../utils/removeNavigationMessage";

export function registerMessages(bot: TelegramBot) {
	bot.on("message", async (msg) => {
		const chatId = msg.chat.id;
		const text = msg.text;

		if (!text) return;

		switch (text) {
			case MENU_TEXTS.CATALOG:
				await removeNavigationMessage(bot, chatId);
				await catalogHandler(bot, chatId);
				break;

			case MENU_TEXTS.ORDERS:
				await removeNavigationMessage(bot, chatId);
				break;

			case MENU_TEXTS.CART:
				await removeNavigationMessage(bot, chatId);
				break;

			default: break;
		}
	});
}
