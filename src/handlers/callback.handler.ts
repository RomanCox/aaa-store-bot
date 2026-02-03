import TelegramBot from "node-telegram-bot-api";
import { CALLBACK_TYPE } from "../types/actions";
import { setChatState } from "../state/chat.state";
import { renderCatalogStep } from "./catalog/renderCatalogStep";
import { parseCallbackData } from "../utils/parseCallbackData";
import { SECTION } from "../types/navigation";
import { handleBack } from "./back.handler";

export function registerCallbacks(bot: TelegramBot) {
	bot.on("callback_query", async (query) => {
		const chatId = query.message?.chat.id;
		const messageId = query.message?.message_id;
		const data = query.data;

		if (!chatId || !data) return;

		const { action, section, params } = parseCallbackData(data);

		console.log(action, section, params)

		if (action === CALLBACK_TYPE.CATALOG) {
			switch (section) {
				case SECTION.CATALOG:
					setChatState(chatId, {
						catalogStep: "products",
						selectedBrand: undefined,
						selectedCategory: undefined,
					});
					break;

				case SECTION.CATALOG_BRANDS: {
					const [brand] = params;

					setChatState(chatId, {
						catalogStep: "categories",
						selectedBrand: brand,
						selectedCategory: undefined,
					});
					break;
				}

				case SECTION.CATALOG_CATEGORIES: {
					const [brand, category] = params;

					setChatState(chatId, {
						catalogStep: "products",
						selectedBrand: brand,
						selectedCategory: category,
					});
					break;
				}

				case SECTION.CATALOG_DOWNLOAD_XLSX:
					await bot.answerCallbackQuery(query.id, {
						text: "Формирование прайса скоро будет доступно",
						show_alert: true,
					});
					return;
			}

			await renderCatalogStep(bot, chatId);
			await bot.answerCallbackQuery(query.id);
			return;
		}

		/** ================= BACK ================= */
		if (data === CALLBACK_TYPE.BACK) {
			// const state = getChatState(chatId);
			//
			// if (state.catalogStep === "products") {
			// 	setChatState(chatId, {
			// 		catalogStep: "categories",
			// 		selectedCategory: undefined,
			// 	});
			// } else if (state.catalogStep === "categories") {
			// 	setChatState(chatId, {
			// 		catalogStep: "brands",
			// 		selectedBrand: undefined,
			// 	});
			// }
			//
			// await renderCatalogStep(bot, chatId);
			// await bot.answerCallbackQuery(query.id);
			// return;
			await handleBack(bot, chatId, messageId);
			await bot.answerCallbackQuery(query.id);
			return;
		}

	// 	/** ================= CATALOG ================= */
	// 	if (data.startsWith("catalog:")) {
	// 		const [, action, value] = data.split(":");
	//
	// 		switch (action) {
	// 			case CALLBACK_TYPE.ALL:
	// 				setChatState(chatId, {
	// 					catalogStep: "products",
	// 					selectedBrand: undefined,
	// 					selectedCategory: undefined,
	// 				});
	// 				break;
	//
	// 			case CALLBACK_TYPE.BRAND:
	// 				setChatState(chatId, {
	// 					catalogStep: "categories",
	// 					selectedBrand: value,
	// 					selectedCategory: undefined,
	// 				});
	// 				break;
	//
	// 			case CALLBACK_TYPE.CATEGORY:
	// 				setChatState(chatId, {
	// 					catalogStep: "products",
	// 					selectedCategory: value,
	// 				});
	// 				break;
	//
	// 			case CALLBACK_TYPE.DOWNLOAD_XLSX:
	// 				// TODO add function for create xlsx
	// 				await bot.answerCallbackQuery(query.id, {
	// 					text: "Формирование прайса скоро будет доступно",
	// 					show_alert: true,
	// 				});
	// 				return;
	// 		}
	//
	// 		await renderCatalogStep(bot, chatId);
	// 		await bot.answerCallbackQuery(query.id);
	// 		return;
	// 	}
	});
}
