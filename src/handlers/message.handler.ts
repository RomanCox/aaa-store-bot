import TelegramBot from "node-telegram-bot-api";
import { MenuButtons } from "../constants/menu-buttons";
import {pricesHandler} from "./prices.handler";

let lastUpdateId = 0;

export function registerMessages(bot: TelegramBot) {
	bot.on("message", async (msg) => {
		const chatId = msg.chat.id;
		const text = msg.text;

		if (!text) return;

		switch (text) {
			case MenuButtons.Prices:
				await pricesHandler(bot, chatId);
				break;

			case "ℹ️ О боте":
				await bot.sendMessage(
					chatId,
					"🤖 Это тестовый бот.\nДанные берутся из Google Sheets."
				);
				break;
			default: break;
		}
	});
}
