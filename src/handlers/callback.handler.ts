import TelegramBot from "node-telegram-bot-api";
import { CALLBACK_TYPE, CATALOG_VALUE, Product, ProductForCart, SECTION, UserRole } from "../types";
import { getChatState, setChatState } from "../state/chat.state";
import { renderFlow } from "./renderFlow";
import { parseCallbackData } from "../utils";
import { handleBack } from "./back.handler";
import { addUser, deleteUser, editUser, startUserManagement, startXlsxUpload } from "../services/admin.service";
import { getProductById, tempExports } from "../services/products.service";
import { renderProductsList } from "../render/renderProductsList";
import { showUsersList } from "./users/users.handler";
import { CART_TEXTS, COMMON_TEXTS, PAGINATION_TEXTS, START_TEXTS, USERS_ERRORS, USERS_TEXTS } from "../texts";
import { createUser, isAdmin, updateUserRole } from "../services/users.service";
import { sendPriceList } from "../services/xlsx.service";
import { editPriceFormation } from "../services/price.service";
import { buildOrderMessage, createOrder } from "../services/orders.service";
import { orderHandler, ordersHandler } from "./orders.handler";
import { renderScreen } from "../render/renderScreen";
import { adminKeyboard } from "../keyboards";

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

        const state = getChatState(chatId);

        if (state.section === SECTION.MAIN) {
          const mainState = state.sections?.[SECTION.MAIN];

          if (!mainState || mainState.flowStep === "main") {
            // рендерим главный экран
            await renderScreen(bot, chatId, {
              section: SECTION.MAIN,
              text: isAdmin(chatId) ? START_TEXTS.ADMIN_PANEL : START_TEXTS.SELECT_ACTION,
              inlineKeyboard: isAdmin(chatId) ? adminKeyboard() : [],
              parse_mode: "HTML",
            });
          } else {
            // рендерим текущий flowStep, например manage_users
            await startUserManagement(bot, chatId);
          }

          return;
        }

        if (state.section === SECTION.CATALOG) {
          await renderFlow(bot, chatId);
          return;
        }

        if (state.section === SECTION.CART) {
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
        const state = getChatState(chatId);
        const mainState = state.sections?.[SECTION.MAIN];

        if (!mainState) return;

        let page = mainState.users?.page ?? 1;

        if (mainState.flowStep === "users_list") {
          if (paramValue === "next") page++;
          if (paramValue === "prev") page--;

          // 👉 GOTO
          if (paramValue === "goto") {
            setChatState(chatId, {
              mode: "await_users_page_number",
            });

            await renderScreen(bot, chatId, {
              section: SECTION.MAIN,
              text: PAGINATION_TEXTS.ENTER_PAGE_NUMBER,
              parse_mode: "HTML",
              withBackButton: true,
            });

            return;
          }
        }

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.MAIN]: {
              ...mainState,
              flowStep: "users_list",
              users: {
                ...mainState.users,
                page,
              },
            },
          },
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
        const mainState = state.sections?.[SECTION.MAIN];

        if (!mainState || mainState.flowStep !== "add_user" || !mainState.users.newUserId) {
          await renderScreen(bot, chatId, {
            section: SECTION.MAIN,
            text: USERS_ERRORS.USER_NOT_CHOOSE_MESSAGE,
          });
          return;
        }

        await createUser({ id: mainState.users.newUserId, role });

        setChatState(chatId, {
          mode: "idle",
          sections: {
            ...state.sections,
            [SECTION.MAIN]: {
              ...mainState,
              users: {
                ...mainState.users,
                newUserId: undefined,
              },
            },
          },
        });

        await renderScreen(bot, chatId, {
          section: SECTION.MAIN,
          text: USERS_TEXTS.ADD_SUCCESSFUL,
          withBackButton: true,
        });

        return;
      }

      case CALLBACK_TYPE.NEW_ROLE_FOR_EXIST_USER: {
        const role = params[0] as UserRole;
        const state = getChatState(chatId);
        const mainState = state.sections?.[SECTION.MAIN];

        if (!mainState || mainState.flowStep !== "edit_user" || !mainState.users.editingUserId) {
          await renderScreen(bot, chatId, {
            section: SECTION.MAIN,
            text: USERS_ERRORS.USER_NOT_CHOOSE_MESSAGE,
          });
          return;
        }

        await updateUserRole(mainState.users.editingUserId, role);

        setChatState(chatId, {
          mode: "idle",
          sections: {
            ...state.sections,
            [SECTION.MAIN]: {
              ...mainState,
              users: {
                ...mainState.users,
                editingUserId: undefined,
              },
            },
          },
        });

        await renderScreen(bot, chatId, {
          section: SECTION.MAIN,
          text: USERS_TEXTS.ROLE_RENEWED + role,
          withBackButton: true,
        });

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
        const state = getChatState(chatId);
        const [brandValue] = params;

        // если выбрали "Все" → сразу рендерим список товаров
        if (brandValue === CATALOG_VALUE.ALL) {
          await renderProductsList(bot, chatId);
          return;
        }

        const currentSection = state.section;

        if (currentSection === SECTION.CATALOG || currentSection === SECTION.CART) {
          setChatState(chatId, {
            sections: {
              ...state.sections,
              [currentSection]: {
                ...state.sections?.[currentSection],
                flowStep: "categories",
                selectedBrand: brandValue,
                selectedCategory: undefined,
              },
            },
          });
        }

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.CATEGORY: {
        const [categoryValue] = params;
        const selectedCategory = categoryValue !== CATALOG_VALUE.ALL ? categoryValue : undefined;

        const state = getChatState(chatId);
        const currentSection = state.section;

        if (currentSection === SECTION.CATALOG || currentSection === SECTION.CART) {
          const nextFlowStep = currentSection === SECTION.CATALOG ? "products" : "models";

          setChatState(chatId, {
            sections: {
              ...state.sections,
              [currentSection]: {
                ...state.sections?.[currentSection],
                flowStep: nextFlowStep,
                selectedCategory,
              },
            },
          });

          if (currentSection === SECTION.CATALOG) {
            await renderProductsList(bot, chatId);
          } else {
            await renderFlow(bot, chatId);
          }

          return;
        }

        return;
      }

      case CALLBACK_TYPE.MODEL: {
        const [selectedModel] = params;
        const state = getChatState(chatId);

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "storage",
              selectedModel,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.STORAGE: {
        const [selectedStorage] = params;
        const state = getChatState(chatId);

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "products_for_cart",
              selectedStorage,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.DOWNLOAD_XLSX: {
        const state = getChatState(chatId);
        const productIds = tempExports.get(params[0]) || [];
        const productsToExport = productIds
          .map(id => getProductById(chatId, id))
          .filter(Boolean) as Product[];

        if (!productsToExport.length) {
          await renderScreen(bot, chatId, {
            section: SECTION.CATALOG,
            text: COMMON_TEXTS.NOT_ITEMS_FOR_EXPORT,
          });
          return;
        }

        await sendPriceList(bot, chatId, productsToExport);
        return;
      }

      case CALLBACK_TYPE.ADD_ITEM_TO_CART: {
        const state = getChatState(chatId);

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "brands",
              selectedBrand: undefined,
              selectedCategory: undefined,
              selectedModel: undefined,
              selectedStorage: undefined,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.CHOOSING_PRODUCT: {
        const [selectedProductId] = params;
        const state = getChatState(chatId);

        setChatState(chatId, {
          mode: "amount_product_for_cart",
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "amount",
              selectedProductId,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.CHOOSING_AMOUNT: {
        const state = getChatState(chatId);
        const [amount] = params;

        if (Number.isNaN(Number(amount))) {
          await renderScreen(bot, chatId, {
            section: SECTION.CART,
            text: CART_TEXTS.AMOUNT_WILL_BE_NUMBER,
          });
          return;
        }

        const choseProduct = getProductById(chatId, state.sections?.[SECTION.CART]?.selectedProductId);

        if (!choseProduct) {
          await renderScreen(bot, chatId, {
            section: SECTION.CART,
            text: CART_TEXTS.PRODUCT_UNAVAILABLE,
          });
          return;
        }

        const productForOrder: ProductForCart = {
          ...choseProduct,
          amount: Number(amount),
        };

        const currentOrder = [...(state.sections?.[SECTION.CART]?.currentOrder || []), productForOrder];

        setChatState(chatId, {
          mode: "idle",
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              selectedProductId: undefined,
              flowStep: "products_for_cart",
              currentOrder,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.CHECK_CART: {
        const state = getChatState(chatId);

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "main",
              selectedBrand: undefined,
              selectedCategory: undefined,
              selectedModel: undefined,
              selectedStorage: undefined,
              selectedAmount: undefined,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.EDITING_ORDER: {
        const state = getChatState(chatId);

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "edit_cart",
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.EDIT_CART_ITEM: {
        const [productId] = params;
        const state = getChatState(chatId);

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "edit_product_in_cart",
              selectedProductIdForCart: productId,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.CLEAR_CART: {
        const state = getChatState(chatId);

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              flowStep: "main",
              currentOrder: undefined,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.INCREASE_AMOUNT: {
        const state = getChatState(chatId);
        const cartState = state.sections?.[SECTION.CART];

        if (!cartState?.currentOrder?.length || !cartState.selectedProductIdForCart) {
          await renderScreen(bot, chatId, {
            section: SECTION.ORDERS,
            text: COMMON_TEXTS.CURRENT_ORDER_ERROR,
          });
          return;
        }

        const updatedOrder = cartState.currentOrder.map(product =>
          product.id === cartState.selectedProductIdForCart
            ? { ...product, amount: product.amount + 1 }
            : product
        );

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              currentOrder: updatedOrder,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.DECREASE_AMOUNT: {
        const state = getChatState(chatId);
        const cartState = state.sections?.[SECTION.CART];

        if (!cartState?.currentOrder?.length || !cartState.selectedProductIdForCart) {
          await renderScreen(bot, chatId, {
            section: SECTION.ORDERS,
            text: COMMON_TEXTS.CURRENT_ORDER_ERROR,
          });
          return;
        }

        const updatedOrder = cartState.currentOrder.map(product =>
          product.id === cartState.selectedProductIdForCart
            ? { ...product, amount: product.amount - 1 }
            : product
        );

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              currentOrder: updatedOrder,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.DELETE_POSITION_FROM_CART: {
        const state = getChatState(chatId);
        const cartState = state.sections?.[SECTION.CART];

        if (!cartState?.currentOrder?.length || !cartState.selectedProductIdForCart) {
          await renderScreen(bot, chatId, {
            section: SECTION.ORDERS,
            text: COMMON_TEXTS.CURRENT_ORDER_ERROR,
          });
          return;
        }

        const updatedOrder = cartState.currentOrder.filter(
          ({ id }) => id !== cartState.selectedProductIdForCart
        );

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              flowStep: "main",
              currentOrder: updatedOrder,
              selectedProductIdForCart: undefined,
            },
          },
        });

        await renderFlow(bot, chatId);
        return;
      }

      case CALLBACK_TYPE.SUBMIT_ORDER: {
        const state = getChatState(chatId);
        const cartState = state.sections?.[SECTION.CART];

        if (!cartState?.currentOrder?.length) {
          return;
        }

        const order = createOrder(query.from, cartState.currentOrder);

        const message = buildOrderMessage(order, chatId);

        // отправляем администратору
        await renderScreen(bot, ADMIN_CHAT_ID, {
          section: SECTION.CART,
          text: message,
          inlineKeyboard: [],
          parse_mode: "HTML",
        });

        // очищаем корзину пользователя
        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...cartState,
              currentOrder: undefined,
              selectedProductIdForCart: undefined,
            },
          },
        });

        // подтверждение пользователю
        await renderScreen(bot, chatId, {
          section: SECTION.CART,
          text: COMMON_TEXTS.ORDER_SENT,
        });

        return;
      }

      case CALLBACK_TYPE.ORDERS: {
        const paramValue = params[0];
        let state = getChatState(chatId);

        // создаём дефолтное состояние раздела ORDERS при первом заходе
        if (!state.sections?.[SECTION.ORDERS]) {
          setChatState(chatId, {
            sections: {
              ...state.sections,
              [SECTION.ORDERS]: {
                messageId: undefined,
                flowStep: "main", // обязательный дефолт
                page: 1,          // обязательный дефолт
                totalPages: 1,
                selectedUserId: undefined,
              },
            },
          });
          // берём обновлённый state
          state = getChatState(chatId);
        }

        const ordersState = state.sections[SECTION.ORDERS]!; // теперь TS точно знает, что не undefined

        // открыть список заказов заново
        if (!paramValue) {
          await ordersHandler(bot, chatId);
          return;
        }

        // ввести номер страницы вручную
        if (paramValue === "goto") {
          setChatState(chatId, { mode: "await_orders_page_number" });

          await renderScreen(bot, chatId, {
            section: SECTION.ORDERS,
            text: PAGINATION_TEXTS.ENTER_PAGE_NUMBER,
          });
          return;
        }

        // вычисляем новую страницу
        let newPage = ordersState.page;
        if (paramValue === "next") newPage++;
        if (paramValue === "prev") newPage--;

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.ORDERS]: {
              ...ordersState,
              page: newPage,
            },
          },
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
