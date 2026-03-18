import TelegramBot from "node-telegram-bot-api";
import { CART_TEXTS, COMMON_TEXTS, MENU_TEXTS, START_TEXTS } from "../texts";
import { getChatState, setChatState } from "../state/chat.state";
import { CatalogFlowStep, ProductForCart, SECTION } from "../types";
import { deleteUserInputHandler } from "./users/deleteUser.handler";
import { editUserInputHandler } from "./users/editUser.handler";
import { addUserInputHandler } from "./users/addUser.handler";
import { editPriceInputHandler } from "./price.handler";
import { getProductById } from "../services/products.service";
import { renderFlow } from "../render/renderFlow";
import { ordersHandler, ordersPageInputHandler } from "./orders.handler";
import { getUser, usersPageInputHandler } from "../services/users.service";
import { renderScreen } from "../render/renderScreen";
import { safeDelete } from "../utils";
import { adminKeyboard, mainKeyboard } from "../keyboards";
import { UI_VERSION } from "../constants";
import { ENV } from "../config/env";

export function registerMessages(bot: TelegramBot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const user = getUser(chatId);
    if (!text || !user) return;

    const state = getChatState(chatId);

    if (state.uiVersion && state.uiVersion !== UI_VERSION) {
      await bot.sendMessage(chatId,
        COMMON_TEXTS.BOT_UI_UPDATED,
        {
          reply_markup: mainKeyboard(chatId),
        }
      );

      setChatState(chatId, {
        uiVersion: UI_VERSION
      });
    }

    const resetCatalogIfLeaving = () => {
      if (state.section === SECTION.CATALOG) {
        return {
          ...state.sections,
          [SECTION.CATALOG]: {
            ...state.sections?.[SECTION.CATALOG],
            flowStep: "brands" as CatalogFlowStep,
            selectedBrand: undefined,
            selectedCategory: undefined,
            lastProductGroups: [],
          },
        };
      }

      return state.sections;
    };

    // ------------------------
    // 1️⃣ Обработка глобального меню
    // ------------------------
    const menuHandlers: Record<string, () => Promise<void>> = {
      [MENU_TEXTS.CATALOG]: async () => {
        setChatState(chatId, {
          section: SECTION.CATALOG,
          mode: "idle",
          sections: {
            ...state.sections,
            [SECTION.CATALOG]: {
              ...state.sections?.[SECTION.CATALOG],
              flowStep: "brands",
              selectedBrand: undefined,
              selectedCategory: undefined,
              lastProductGroups: [],
            },
          },
        });
        await renderFlow(bot, chatId);
      },

      [MENU_TEXTS.CART]: async () => {
        setChatState(chatId, {
          section: SECTION.CART,
          mode: "idle",
          sections: resetCatalogIfLeaving(),
        });
        await renderFlow(bot, chatId);
      },

      [MENU_TEXTS.ORDERS]: async () => {
        setChatState(chatId, {
          section: SECTION.ORDERS,
          mode: "idle",
          sections: {
            ...resetCatalogIfLeaving(),
            [SECTION.ORDERS]: {
              ...state.sections?.[SECTION.ORDERS],
              page: 1,
              totalPages: 1,
              selectedUserId: undefined,
              flowStep: state.sections?.[SECTION.ORDERS]?.flowStep ?? "main", // <-- обязательно
            },
          },
        });

        await ordersHandler(bot, chatId);
      },

      [MENU_TEXTS.ADMIN_PANEL]: async () => {
        setChatState(chatId, {
          section: SECTION.ADMIN_PANEL,
          mode: "idle",
          sections: {
            ...resetCatalogIfLeaving(),
            [SECTION.ADMIN_PANEL]: {
              ...state.sections?.[SECTION.ADMIN_PANEL],
              flowStep: state.sections?.[SECTION.ADMIN_PANEL]?.flowStep ?? "main",
              users: {
                page: 1,
                totalPages: 1,
                editingUserId: undefined,
                newUserId: undefined,
              }
            }
          }
        });

        await renderScreen(bot, chatId, {
          section: SECTION.ADMIN_PANEL,
          text: START_TEXTS.ADMIN_PANEL,
          inlineKeyboard: adminKeyboard(),
          parse_mode: "HTML",
        });
      },

      [MENU_TEXTS.MANAGER]: async () => {
        const managerUrl =
          user.role === "retail"
            ? ENV.RETAIL_MANAGER_URL
            : ENV.WHOLESALE_MANAGER_URL;

        await bot.sendMessage(chatId, "Открыть чат с менеджером:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💬 Написать менеджеру", url: managerUrl }],
            ],
          },
        });
      },
    };

    if (menuHandlers[text]) {
      await menuHandlers[text]();

      // Удаляем сообщение пользователя после обработки
      await safeDelete(bot, msg.message_id);
      return;
    }

    // ------------------------
    // 2️⃣ Обработка режимов (mode)
    // ------------------------
    const modeHandlers: Record<string, (text: string) => Promise<void>> = {
      add_user: async (t) => await addUserInputHandler(bot, chatId, t),
      delete_user: async (t) => await deleteUserInputHandler(bot, chatId, t),
      edit_user: async (t) => await editUserInputHandler(bot, chatId, t),

      edit_rub_to_byn: async (t) => await editPriceInputHandler(bot, chatId, t),
      edit_rub_to_usd: async (t) => await editPriceInputHandler(bot, chatId, t),

      await_users_page_number: async (t) => {
        await usersPageInputHandler(bot, chatId, t);
        setChatState(chatId, { mode: "idle" });
      },

      await_orders_page_number: async (t) => {
        await ordersPageInputHandler(bot, chatId, t);
        setChatState(chatId, { mode: "idle" });
      },

      choose_userId_for_orders: async (t) => {
        await ordersHandler(bot, chatId, t);
        setChatState(chatId, { mode: "idle" });
      },

      // ------------------------
      // Корзина
      // ------------------------
      amount_product_for_cart: async (t) => {
        const amount = Number(t);
        if (Number.isNaN(amount)) {
          await renderScreen(bot, chatId, { section: SECTION.CART, text: CART_TEXTS.AMOUNT_WILL_BE_NUMBER });
          return;
        }

        const choseProduct = getProductById(chatId, state.sections.cart?.selectedProductId);
        if (!choseProduct) {
          await renderScreen(bot, chatId, { section: SECTION.CART, text: CART_TEXTS.PRODUCT_UNAVAILABLE });
          return;
        }

        const productForOrder: ProductForCart = { ...choseProduct, amount };
        const currentOrder = [...(state.sections.cart?.currentOrder || []), productForOrder];

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
      },

      edit_product_amount_in_cart: async (t) => {
        if (!state.sections.cart?.currentOrder?.length || !state.sections.cart.selectedProductIdForCart) return;
        const amount = Number(t);
        if (Number.isNaN(amount)) return;

        const updatedOrder = state.sections.cart.currentOrder.map((p) =>
          p.id === state.sections.cart?.selectedProductIdForCart ? { ...p, amount } : p
        );

        setChatState(chatId, {
          sections: {
            ...state.sections,
            [SECTION.CART]: {
              ...state.sections?.[SECTION.CART],
              currentOrder: updatedOrder,
            },
          },
        });

        await renderFlow(bot, chatId);
      },
    };

    const handler = modeHandlers[state.mode];
    if (handler) {
      await handler(text);

      // Удаляем сообщение пользователя после обработки
      await safeDelete(bot, msg.message_id);
      return;
    }
  });
}