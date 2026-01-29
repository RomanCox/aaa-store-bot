import TelegramBot from "node-telegram-bot-api";
import { getProductsByCategory } from "../cache/products.cache";
import { splitMessage } from "../utils/telegram";
import { getChatState, setChatState } from "../cache/chat.cache";
import { getCategories } from "../services/categories.service";
import { categoriesKeyboard } from "../keyboards/categories.keyboard";
import { backKeyboard } from "../keyboards/back.keyboard";
// import {Actions} from "../constants/actions";
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

    const state = getChatState(chatId);

    if (query.data === "back") {
      if (state.productsMessageIds?.length) {
        for (const id of state.productsMessageIds) {
          await bot.deleteMessage(chatId, id).catch(() => {});
        }
      }

      const categories = await getCategories();
      const msg = await bot.sendMessage(
        chatId,
        "Выберите категорию 👇",
        { reply_markup: categoriesKeyboard(categories) }
      );

      setChatState(chatId, {
        categoriesMessageId: msg.message_id,
        productsMessageIds: [],
      });

      await bot.answerCallbackQuery(query.id);
      return;
    }

		if (!query.data.startsWith("category:")) return;

		const category = query.data.replace("category:", "");

    if (state.categoriesMessageId) {
      await bot.deleteMessage(chatId, state.categoriesMessageId).catch(() => {});
    }

		const products = getProductsByCategory(category);

		const text = products
      .map(p => {
        const main = [p.name, p.price].filter(Boolean).join(" - ");
        return p.country ? `${main} ${p.country}` : main;
      })
      .filter(Boolean)
			.join("\n");

    if (!products.length || !text) {
      await bot.sendMessage(chatId, "В этой категории пока нет товаров");
      return;
    }

		const messages = splitMessage(text);
    const sentIds: number[] = [];

		for (const msg of messages) {
      if (!msg || msg.trim() === "") continue;
			const sentMessage = await bot.sendMessage(chatId, msg);
      sentIds.push(sentMessage.message_id);
		}

    const lastMsgId = state?.productsMessageIds?.slice(-1)[0];

    if (lastMsgId) {
      await bot.editMessageReplyMarkup(
        {
          inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "back" }]],
        },
        {
          chat_id: chatId,
          message_id: lastMsgId,
        }
      );
    }

    // const backMsg = await bot.sendMessage(
    //   chatId,
    //   "Выберите действие:",
    //   { reply_markup: backKeyboard() }
    // );

    // sentIds.push(backMsg.message_id);

    setChatState(chatId, {
      productsMessageIds: sentIds,
      categoriesMessageId: undefined,
    });

    // обязательно закрываем "часики" у кнопки
    await bot.answerCallbackQuery(query.id);
  });
}
