import TelegramBot from "node-telegram-bot-api";
import { getProductsByCategory } from "../cache";
import {splitMessage} from "../utils/telegram";
// import { Actions } from "../constants/actions";
// import { pricesKeyboard } from "../keyboards/prices.keyboard";

export function registerCallbacks(bot: TelegramBot) {
  bot.on("callback_query", async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId || !query.data || !query.message) return;

    // switch (query.data) {
		// 	case Actions.PricesAll:
		// 		await bot.sendMessage(chatId, "📦 Все товары");
		// 		break;
		//
		// 	case Actions.PricesSmartphones:
		// 		await bot.sendMessage(chatId, "📱 Смартфоны");
		// 		break;
		//
		// 	case Actions.PricesLaptops:
		// 		await bot.sendMessage(chatId, "💻 Ноутбуки");
		// 		break;
		//
		// 	case Actions.PricesTablets:
		// 		await bot.sendMessage(chatId, "📟 Планшеты");
		// 		break;
		//
		// 	case Actions.PricesHeadphones:
		// 		await bot.sendMessage(chatId, "🎧 Наушники");
		// 		break;
		//
		// 	case Actions.PricesBack:
		// 		await bot.editMessageText(
		// 			"Выберите категорию 👇",
		// 			{
		// 				chat_id: chatId,
		// 				message_id: query.message!.message_id,
		// 				reply_markup: pricesKeyboard(),
		// 			}
		// 		);
		// 		break;
		//
		// 	case Actions.PricesDownload:
		// 		await bot.sendMessage(chatId, "📥 Готовлю прайслист...");
		// 		break;
		//
    //   default:
    //     await bot.sendMessage(chatId, "Неизвестная команда 🤷‍♂️");
    // }

		if (!query.data.startsWith("category:")) return;

		const category = query.data.replace("category:", "");

		const products = getProductsByCategory(category);

		if (!products.length) {
			await bot.sendMessage(chatId, "В этой категории пока нет товаров");
			return;
		}

		const text = products
			.map(p => `${p.name} - ${p.price} ${p.country}`)
			.join("\n");

		const messages = splitMessage(text);

		for (const msg of messages) {
			await bot.sendMessage(chatId, msg);
		}

    // обязательно закрываем "часики" у кнопки
    await bot.answerCallbackQuery(query.id);
  });
}
