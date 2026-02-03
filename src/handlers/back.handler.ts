import TelegramBot from "node-telegram-bot-api";
import { getChatState, setChatState } from "../state/chat.state";
import { SECTION } from "../types/navigation";
import { AdminBackMap } from "../constants/admin";
import { renderCatalogStep } from "./catalog/renderCatalogStep";

export async function handleBack(bot: TelegramBot, chatId: number, messageId?: number) {
	const state = getChatState(chatId);

	if (messageId) {
		await bot
			.deleteMessage(chatId, messageId)
			.catch(err => {
				console.error(
					"❌ deleteMessage failed",
					messageId,
					err.response?.body || err.message
				);
			});
	}

	switch (state.section) {
		/** ---------------- ADMIN ---------------- */
		case SECTION.ADMIN:
			break;

		case SECTION.ADMIN_USERS:
			const prevAdminStep = AdminBackMap[state.adminStep!];
			if (prevAdminStep) {
				await bot.sendMessage(chatId, "👨‍💼 Меню администратора", {
					reply_markup: {
						inline_keyboard: [
							[{ text: "📤 Загрузить XLSX", callback_data: "admin:upload_xlsx" }],
							[{ text: "👥 Управление пользователями", callback_data: "admin:manage_users" }],
						],
					},
				});
				setChatState(chatId, { section: SECTION.ADMIN, adminStep: prevAdminStep });
			}
			break;

		/** ---------------- CATALOG ---------------- */
		case SECTION.CATALOG:
			break;
		case SECTION.CATALOG_BRANDS:
			setChatState(chatId, {
				section: SECTION.CATALOG,
			});

			await renderCatalogStep(bot, chatId);
			break;
		case SECTION.CATALOG_CATEGORIES:
			if (state.selectedBrand) {
				setChatState(chatId, {
					selectedBrand: undefined,
				});

				await renderCatalogStep(bot, chatId);
			}
			break;
		case SECTION.CATALOG_PRODUCTS:
			if (state.selectedCategory) {
				setChatState(chatId, {
					selectedCategory: undefined,
				});

				await renderCatalogStep(bot, chatId);
			}
			break;

		/** ---------------- CART ---------------- */
		// case "cart_variant":
		// 	// обнулить последний выбор
		// 	setChatState(chatId, { section: "cart_product", selectedVariantId: undefined });
		// 	await showProducts(bot, chatId, state.selectedBrand!, state.selectedCategory!);
		// 	break;
		//
		// case "cart_product":
		// 	setChatState(chatId, { section: "cart_category", selectedProductId: undefined });
		// 	await showCategories(bot, chatId, state.selectedBrand!);
		// 	break;
		//
		// case "cart_category":
		// 	setChatState(chatId, { section: "cart_brand", selectedCategory: undefined });
		// 	await showBrands(bot, chatId);
		// 	break;
		//
		// case "cart_brand":
		// 	setChatState(chatId, { section: "cart", selectedBrand: undefined });
		// 	await showCartRoot(bot, chatId);
		// 	break;

		default:
			break;
	}
}
