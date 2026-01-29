import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import {Actions} from "../constants/actions";

export function categoriesKeyboard(categories: string[]): InlineKeyboardMarkup {
	const keyboard = [];

	keyboard.push([
		{ text: "📦 Все", callback_data: `category:${Actions.PricesAll}` },
	]);

	for (let i = 0; i < categories.length; i += 2) {
		keyboard.push(
			categories.slice(i, i + 2).map(cat => ({
				text: cat,
				callback_data: `category:${cat}`,
			}))
		);
	}

	keyboard.push(
		[{ text: "⬅ Назад", callback_data: "prices:back" }],
		[{ text: "📥 Скачать прайслист", callback_data: "prices:download" }]
	);

	return { inline_keyboard: keyboard };
}