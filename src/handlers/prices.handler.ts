import TelegramBot from "node-telegram-bot-api";

import { getCategories } from "../services/categories.service";
import { categoriesKeyboard } from "../keyboards/categories.keyboard";

export const pricesHandler = async (bot: TelegramBot, chatId: number) => {
	const loadingMsg = await bot.sendMessage(
		chatId,
		"⏳ Загружаю товары...",
		{
			reply_markup: {
				inline_keyboard: [
					[{ text: "⬅ Назад", callback_data: "prices:back" }],
				],
			},
		}
	);

	try {
		const categories = await getCategories();

		await bot.editMessageText(
			"Выберите категорию 👇",
			{
				chat_id: chatId,
				message_id: loadingMsg.message_id,
				reply_markup: categoriesKeyboard(categories),
			}
		);
	} catch (e) {
		await bot.editMessageText(
			"❌ Ошибка загрузки данных",
			{
				chat_id: chatId,
				message_id: loadingMsg.message_id,
			}
		);
	}
}