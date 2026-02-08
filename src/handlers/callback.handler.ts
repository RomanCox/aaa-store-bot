import TelegramBot from "node-telegram-bot-api";
import { CALLBACK_TYPE, CATALOG_VALUE } from "../types/actions";
import { getChatState, setChatState } from "../state/chat.state";
import { renderCatalogStep } from "./catalog/renderCatalogStep";
import { parseCallbackData } from "../utils/parseCallbackData";
import { SECTION } from "../types/navigation";
import { handleBack } from "./back.handler";
import { deleteUser, startUserManagement, startXlsxUpload } from "../services/admin.service";
import { renderAdminPanel } from "./main/renderAdminPanel";
import { clearChatMessages } from "../utils/clearChatMessages";
import { getProducts } from "../services/products.service";
import { renderProductsList } from "../render/renderProductsList";
import { openUsersList, showUsersList } from "./users/users.handler";
import { setUserState } from "../state/user.state";
import { PAGINATION_TEXTS } from "../texts/pagination.texts";

export function registerCallbacks(bot: TelegramBot) {
	bot.on("callback_query", async (query) => {
		const chatId = query.message?.chat.id;
		const messageId = query.message?.message_id;
		const data = query.data;

		if (!chatId || !data) return;

		await bot.answerCallbackQuery(query.id);

		const {action, params} = parseCallbackData(data);

		switch (action) {
			case CALLBACK_TYPE.BACK: {
				await handleBack(bot, chatId, messageId);
				const nextState = getChatState(chatId);

				if (nextState.section === SECTION.MAIN) {
					await renderAdminPanel(bot, chatId);
					return;
				}

				if (nextState.section === SECTION.CATALOG) {
					await renderCatalogStep(bot, chatId);
					return;
				}
				return;
			}

			case CALLBACK_TYPE.UPLOAD_XLSX: {
				await startXlsxUpload(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.MANAGE_USERS: {
				await startUserManagement(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.USERS_LIST: {
				const paramValue = params[0];

				if (!paramValue) {
					await openUsersList(bot, chatId);
					return;
				}

				if (paramValue === "goto") {
					setUserState(chatId, { mode: "await_page_number" });
					await bot.sendMessage(chatId, PAGINATION_TEXTS.ENTER_PAGE_NUMBER);
					return;
				}

				await clearChatMessages(bot, chatId);

				const state = getChatState(chatId);
				let newPage = state.page ?? 1;
				if (paramValue === "next") newPage++;
				if (paramValue === "prev") newPage--;

				setChatState(chatId, {
					page: newPage,
				});

				await clearChatMessages(bot, chatId);
				await showUsersList(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.ADD_USER: {
				return;
			}

			case CALLBACK_TYPE.DELETE_USER: {
				await deleteUser(bot, chatId);
				return;
			}

      case CALLBACK_TYPE.EDIT_USER: {
        return;
      }

			case CALLBACK_TYPE.BRAND: {
				await clearChatMessages(bot, chatId);

				const [brandValue] = params;

				if (brandValue === CATALOG_VALUE.ALL) {
					const products = getProducts();

					await renderProductsList(bot, chatId, products, {
						backToStep: "brands",
					});

					return;
				}

				setChatState(chatId, {
					section: SECTION.CATALOG,
					catalogStep: "categories",
					selectedBrand: brandValue,
					selectedCategory: undefined,
				});

				await renderCatalogStep(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.CATEGORY: {
				await clearChatMessages(bot, chatId);

				const [, categoryValue] = params;

				const products = getProducts(
					getChatState(chatId).selectedBrand,
					categoryValue !== CATALOG_VALUE.ALL ? categoryValue : undefined,
				);

				setChatState(chatId, {
					section: SECTION.CATALOG,
					catalogStep: "products",
					selectedCategory: categoryValue,
				});

				await renderProductsList(bot, chatId, products, {
					backToStep: "categories",
				});
				return;
			}
		}
	});
}
