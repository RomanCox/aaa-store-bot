import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { Actions } from "../constants/actions";

export function pricesKeyboard(): InlineKeyboardMarkup {
	return {
		inline_keyboard: [
			[
				{
					text: "📦 Все",
					callback_data: Actions.PricesAll,
				},
			],
			[
				{
					text: "📱 Смартфоны",
					callback_data: Actions.PricesSmartphones,
				},
				{
					text: "💻 Ноутбуки",
					callback_data: Actions.PricesLaptops,
				},
			],
			[
				{
					text: "📟 Планшеты",
					callback_data: Actions.PricesTablets,
				},
				{
					text: "🎧 Наушники",
					callback_data: Actions.PricesHeadphones,
				},
			],
			[
				{
					text: "⬅️ Назад",
					callback_data: Actions.PricesBack,
				},
			],
			[
				{
					text: "📥 Скачать прайслист",
					callback_data: Actions.PricesDownload,
				},
			],
		],
	};
}
