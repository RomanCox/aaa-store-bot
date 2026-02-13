import TelegramBot from "node-telegram-bot-api";
import { getChatState, setChatState } from "../state/chat.state";
import { SECTION } from "../types";
import { clearChatMessages } from "../utils";
import { startUserManagement } from "../services/admin.service";

export async function handleBack(bot: TelegramBot, chatId: number) {
	const state = getChatState(chatId);
	await clearChatMessages(bot, chatId);

	if (state.section === SECTION.UPLOAD_XLSX) {
		setChatState(chatId, {
			mode: "idle",
		});
		setChatState(chatId, { section: SECTION.MAIN });
		return;
	}

	if (state.section === SECTION.MANAGE_USERS) {
		if (state.adminStep === "users_list") {
			setChatState(chatId, { adminStep: "main" });
			await startUserManagement(bot, chatId);
			return;
		}

		if (["add_user", "delete_user", "edit_user"].includes(state.adminStep ?? "")) {
			setChatState(chatId, { mode: "idle", adminStep: "main" });
			await startUserManagement(bot, chatId);
			return;
		}

		setChatState(chatId, { section: SECTION.MAIN });
		return;
	}

	if (state.section === SECTION.CATALOG) {
		switch (state.flowStep) {
			case "brands":
				setChatState(chatId, {
					section: SECTION.MAIN,
					flowStep: undefined,
				});
				return;

			case "categories":
				setChatState(chatId, {
					section: SECTION.CATALOG,
					flowStep: "brands",
					selectedBrand: undefined,
				});
				return;

			case "products":
				setChatState(chatId, {
					flowStep: "categories",
					selectedCategory: undefined,
				});
				return;
		}
	}

	if (state.section === SECTION.CART) {
		switch (state.flowStep) {
			case "main":
				setChatState(chatId, {
					section: SECTION.MAIN,
					flowStep: undefined,
				});
				return;

			case "brands":
				setChatState(chatId, {
					flowStep: "main",
				});
				return;

			case "categories":
				setChatState(chatId, {
					flowStep: "brands",
					selectedBrand: undefined,
				});
				return;

			case "models":
				setChatState(chatId, {
					flowStep: "categories",
					selectedCategory: undefined,
				});
				return;

			case "storage":
				setChatState(chatId, {
					flowStep: "models",
					selectedModel: undefined,
				});
				return;

			case "products_for_cart":
				setChatState(chatId, {
					flowStep: "storage",
					selectedStorage: undefined,
				});
				return;

			case "amount":
				setChatState(chatId, {
					section: SECTION.CART,
					flowStep: "products_for_cart",
					selectedProductId: undefined,
				});
				return;

			case "edit_cart":
				setChatState(chatId, {
					section: SECTION.CART,
					flowStep: "main",
				});
				return;

			case "edit_product_in_cart":
				setChatState(chatId, {
					flowStep: "edit_cart",
					selectedProductIdForCart: undefined,
				});
				return;
		}
	}
}
