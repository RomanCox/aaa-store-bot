import TelegramBot from "node-telegram-bot-api";
import { CALLBACK_TYPE, CATALOG_VALUE, Product, ProductForCart, SECTION, UserRole } from "../types";
import { getChatState, setChatState } from "../state/chat.state";
import { renderFlow } from "./renderFlow";
import { parseCallbackData, removeNavigationMessage } from "../utils";
import { handleBack } from "./back.handler";
import { addUser, deleteUser, editUser, startUserManagement, startXlsxUpload } from "../services/admin.service";
import { renderAdminPanel } from "./main/renderAdminPanel";
import { getProductById, tempExports } from "../services/products.service";
import { renderProductsList } from "../render/renderProductsList";
import { showUsersList } from "./users/users.handler";
import { CART_TEXTS, COMMON_TEXTS, PAGINATION_TEXTS, USERS_ERRORS, USERS_TEXTS } from "../texts";
import { createUser, updateUserRole } from "../services/users.service";
import { sendPriceList } from "../services/xlsx.service";
import { editPriceFormation } from "../services/price.service";
import { addOrder, buildOrderMessage, createOrder } from "../services/orders.service";
import { orderHandler, ordersHandler } from "./orders.handler";
import { renderScreen } from "../render/renderScreen";

const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);

export function registerCallbacks(bot: TelegramBot) {
	bot.on("callback_query", async (query) => {
		const chatId = query.message?.chat.id;
		const data = query.data;

		if (!chatId || !data) return;

		await bot.answerCallbackQuery(query.id);

		const {action, params} = parseCallbackData(data);

		switch (action) {
			case CALLBACK_TYPE.BACK: {
				await handleBack(bot, chatId);
				const nextState = getChatState(chatId);

				if (nextState.section === SECTION.MAIN) {
					await renderAdminPanel(bot, chatId);
					return;
				}

				if (nextState.section === SECTION.CATALOG) {
					setChatState(chatId, { selectedCategory: undefined });
					await renderFlow(bot, chatId);
					return;
				}

				if (nextState.section === SECTION.CART) {
					await renderFlow(bot, chatId);
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

        // Открыть список заново
        if (!paramValue) {
          await showUsersList(bot, chatId);
          return;
        }

        const state = getChatState(chatId);
        let newPage = state.usersPage ?? 1;

        if (paramValue === "next") newPage++;
        if (paramValue === "prev") newPage--;

        if (paramValue === "goto") {
          setChatState(chatId, {
            ...state,
            mode: "await_users_page_number",
          });

          // ⚠ если хочешь остаться в рамках одного сообщения:
          await renderScreen(
            bot,
            chatId,
            PAGINATION_TEXTS.ENTER_PAGE_NUMBER,
            [
              [
                {
                  text: COMMON_TEXTS.BACK_BUTTON,
                  callback_data: CALLBACK_TYPE.USERS_LIST,
                },
              ],
            ],
            "HTML"
          );
          return;
        }

        setChatState(chatId, {
          ...state,
          usersPage: newPage,
        });

        await showUsersList(bot, chatId);
        return;
      }

			case CALLBACK_TYPE.ADD_USER: {
				await addUser(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.DELETE_USER: {
				await deleteUser(bot, chatId);
				return;
			}

      case CALLBACK_TYPE.EDIT_USER: {
				await editUser(bot, chatId);
				return;
      }

			case CALLBACK_TYPE.ROLE_FOR_NEW_USER: {
				const role = params[0] as UserRole;
				const state = getChatState(chatId);

				if (!state.newUserId) {
          await renderScreen(bot, chatId, USERS_ERRORS.USER_NOT_CHOOSE_MESSAGE);
					return;
				}

				await createUser({ id: state.newUserId, role });

				setChatState(chatId, { mode: "idle" });

        await renderScreen(bot, chatId, USERS_TEXTS.ADD_SUCCESSFUL, [[{
          text: COMMON_TEXTS.BACK_BUTTON,
          callback_data: CALLBACK_TYPE.BACK
        }]]);
				return;
			}

      case CALLBACK_TYPE.NEW_ROLE_FOR_EXIST_USER: {
        const role = params[0] as UserRole;
        const state = getChatState(chatId);

        if (!state.editingUserId) {
          await renderScreen(bot, chatId, USERS_ERRORS.USER_NOT_CHOOSE_MESSAGE);
          return;
        }

        await updateUserRole(state.editingUserId, role);

        setChatState(chatId, { mode: "idle" });

        await renderScreen(bot, chatId, USERS_TEXTS.ROLE_RENEWED + role, [[{
          text: COMMON_TEXTS.BACK_BUTTON,
          callback_data: CALLBACK_TYPE.BACK
        }]]);
        return;
      }

			case CALLBACK_TYPE.EDIT_RUB_TO_BYN: {
				await editPriceFormation(bot, chatId, "edit_rub_to_byn");
				return;
			}

			case CALLBACK_TYPE.EDIT_RUB_TO_USD: {
				await editPriceFormation(bot, chatId, "edit_rub_to_usd");
				return;
			}

			case CALLBACK_TYPE.EDIT_RETAIL_MULT: {
				await editPriceFormation(bot, chatId, "edit_retail_mult");
				return;
			}

			case CALLBACK_TYPE.EDIT_WHOLESALE_MULT: {
				await editPriceFormation(bot, chatId, "edit_wholesale_mult");
				return;
			}

			case CALLBACK_TYPE.BRAND: {
				const [brandValue] = params;

				if (brandValue === CATALOG_VALUE.ALL) {
					await renderProductsList(bot, chatId);

					return;
				}

				setChatState(chatId, {
					flowStep: "categories",
					selectedBrand: brandValue,
					selectedCategory: undefined,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.CATEGORY: {
				const [categoryValue] = params;

				const selectedCategory = categoryValue !== CATALOG_VALUE.ALL ? categoryValue : undefined;

				const state = getChatState(chatId);

				const nextStep = state.section === SECTION.CATALOG ? "products" : "models";

				setChatState(chatId, {
					flowStep: nextStep,
					selectedCategory,
				});

				if (state.section === SECTION.CATALOG) {
					await renderProductsList(bot, chatId);
					return;
				}

				if (state.section === SECTION.CART) {
					await renderFlow(bot, chatId);
					return;
				}
				return;
			}

			case CALLBACK_TYPE.MODEL: {
				const [modelValue] = params;

				setChatState(chatId, {
					flowStep: "storage",
					selectedModel: modelValue,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.STORAGE: {
				const [storageValue] = params;

				setChatState(chatId, {
					flowStep: "products_for_cart",
					selectedStorage: storageValue,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.DOWNLOAD_XLSX: {
        const productIds = tempExports.get(params[0]) || [];
        const productsToExport = productIds
          .map(id => getProductById(chatId, id))
          .filter(Boolean) as Product[];

        if (!productsToExport.length) {
          await renderScreen(bot, chatId, COMMON_TEXTS.NOT_ITEMS_FOR_EXPORT);
          return;
        }

				await sendPriceList(bot, chatId, productsToExport);
				return;
			}

			case CALLBACK_TYPE.ADD_ITEM_TO_CART: {
				setChatState(chatId, {
					section: SECTION.CART,
					flowStep: "brands",
					selectedBrand: undefined,
					selectedCategory: undefined,
					selectedModel: undefined,
					selectedStorage: undefined,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.CHOOSING_PRODUCT: {
				const [ selectedProductId ] = params;

				setChatState(chatId, {
					mode: "amount_product_for_cart",
					flowStep: "amount",
					selectedProductId,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.CHOOSING_AMOUNT: {
				const state = getChatState(chatId);
				const [ amount ] = params;

				if (Number.isNaN(amount)) {
          await renderScreen(bot, chatId, CART_TEXTS.AMOUNT_WILL_BE_NUMBER);
					return;
				}

				const choseProduct = getProductById(chatId, state.selectedProductId);

				if (!choseProduct) {
          await renderScreen(bot, chatId, CART_TEXTS.PRODUCT_UNAVAILABLE);
					return;
				}

				const productForOrder: ProductForCart = {
					...choseProduct,
					amount: Number(amount),
				};

				const currentOrder = [ ...(state.currentOrder || []), productForOrder ];

				setChatState(chatId, {
          mode: "idle",
					selectedProductId: undefined,
					flowStep: "products_for_cart",
					currentOrder,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.CART: {
				await removeNavigationMessage(bot, chatId);

				setChatState(chatId, {
					section: SECTION.CART,
					selectedBrand: undefined,
					selectedCategory: undefined,
					selectedModel: undefined,
					selectedStorage: undefined,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.CHECK_CART: {
				setChatState(chatId, {
					flowStep: "main",
					selectedBrand: undefined,
					selectedCategory: undefined,
					selectedModel: undefined,
					selectedStorage: undefined,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.EDITING_ORDER: {
				setChatState(chatId, {
					flowStep: "edit_cart",
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.EDIT_CART_ITEM: {
				const [productId] = params;

				setChatState(chatId, {
					flowStep: "edit_product_in_cart",
					selectedProductIdForCart: productId,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.CLEAR_CART: {
				setChatState(chatId, {
					currentOrder: undefined,
				});

				await renderFlow(bot, chatId);
				return;
			}

			case CALLBACK_TYPE.INCREASE_AMOUNT: {
				const state = getChatState(chatId);

				if (!state.currentOrder?.length || !state.selectedProductIdForCart) {
          await renderScreen(bot, chatId, COMMON_TEXTS.CURRENT_ORDER_ERROR);
					return;
				}

				const updatedOrder = state.currentOrder.map(product =>
					product.id === state.selectedProductIdForCart
						? { ...product, amount: product.amount + 1 }
						: product
				);

				setChatState(chatId, {
					currentOrder: updatedOrder,
				});

				await renderFlow(bot, chatId);

				return;
			}

			case CALLBACK_TYPE.DECREASE_AMOUNT: {
				const state = getChatState(chatId);

				if (!state.currentOrder?.length || !state.selectedProductIdForCart) {
          await renderScreen(bot, chatId, COMMON_TEXTS.CURRENT_ORDER_ERROR);
					return;
				}

				const updatedOrder = state.currentOrder.map(product =>
					product.id === state.selectedProductIdForCart
						? { ...product, amount: product.amount - 1 }
						: product
				);

				setChatState(chatId, {
					currentOrder: updatedOrder,
				});

				await renderFlow(bot, chatId);

				return;
			}

			case CALLBACK_TYPE.DELETE_POSITION_FROM_CART: {
				const state = getChatState(chatId);

				if (!state.currentOrder?.length || !state.selectedProductIdForCart) {
          await renderScreen(bot, chatId, COMMON_TEXTS.CURRENT_ORDER_ERROR);
					return;
				}

				const updatedOrder = state.currentOrder.filter(({ id }) => id !== state.selectedProductIdForCart);

				setChatState(chatId, {
					flowStep: "main",
					currentOrder: updatedOrder,
					selectedProductIdForCart: undefined,
				});

				await renderFlow(bot, chatId);

				return;
			}

			case CALLBACK_TYPE.SUBMIT_ORDER: {
				const state = getChatState(chatId);

				if (!state.currentOrder?.length) {
					return;
				}

        const order = createOrder(query.from, state.currentOrder);

				const message = buildOrderMessage(
					order,
					chatId
				);

        addOrder(order);
        await renderScreen(bot, ADMIN_CHAT_ID, message, [], "HTML");

				setChatState(chatId, {
					currentOrder: undefined,
					selectedProductIdForCart: undefined,
				});

				await renderScreen(bot, chatId, COMMON_TEXTS.ORDER_SENT);
				return;
			}

      case CALLBACK_TYPE.ORDERS: {
        const paramValue = params[0];

        if (!paramValue) {
          await ordersHandler(bot, chatId);
          return;
        }

        if (paramValue === "goto") {
          setChatState(chatId, { mode: "await_orders_page_number" });
          await renderScreen(bot, chatId, PAGINATION_TEXTS.ENTER_PAGE_NUMBER);
          return;
        }

        const state = getChatState(chatId);
        let newPage = state.ordersPage ?? 1;
        if (paramValue === "next") newPage++;
        if (paramValue === "prev") newPage--;

        setChatState(chatId, {
          ordersPage: newPage,
        });

        await ordersHandler(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.CHOOSE_ORDER: {
        await orderHandler(bot, chatId, params[0]);
        return;
      }
		}
	});
}
