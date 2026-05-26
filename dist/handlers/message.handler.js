"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMessages = registerMessages;
const texts_1 = require("../texts");
const chat_state_1 = require("../state/chat.state");
const types_1 = require("../types");
const deleteUser_handler_1 = require("./users/deleteUser.handler");
const editUser_handler_1 = require("./users/editUser.handler");
const addUser_handler_1 = require("./users/addUser.handler");
const price_handler_1 = require("./price.handler");
const renderFlow_1 = require("../render/renderFlow");
const orders_handler_1 = require("./orders.handler");
const users_service_1 = require("../services/users.service");
const renderScreen_1 = require("../render/renderScreen");
const utils_1 = require("../utils");
const keyboards_1 = require("../keyboards");
const constants_1 = require("../constants");
const env_1 = require("../config/env");
const catalog_ui_1 = require("../services/catalog/ui/catalog.ui");
function registerMessages(bot) {
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        const user = (0, users_service_1.getUser)(chatId);
        if (!text || !user)
            return;
        const state = (0, chat_state_1.getChatState)(chatId);
        if (state.uiVersion && state.uiVersion !== constants_1.UI_VERSION) {
            await bot.sendMessage(chatId, texts_1.COMMON_TEXTS.BOT_UI_UPDATED, {
                reply_markup: (0, keyboards_1.mainKeyboard)(chatId),
            });
            (0, chat_state_1.setChatState)(chatId, {
                uiVersion: constants_1.UI_VERSION
            });
        }
        const resetCatalogIfLeaving = () => {
            if (state.section === types_1.SECTION.CATALOG) {
                return {
                    ...state.sections,
                    [types_1.SECTION.CATALOG]: {
                        ...state.sections?.[types_1.SECTION.CATALOG],
                        flowStep: "brands",
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
        const menuHandlers = {
            [texts_1.MENU_TEXTS.CATALOG]: async () => {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    (0, chat_state_1.setChatState)(chatId, {
                        section: types_1.SECTION.CATALOG,
                        mode: "idle",
                        sections: {
                            ...state.sections,
                            [types_1.SECTION.CATALOG]: {
                                ...state.sections?.[types_1.SECTION.CATALOG],
                                flowStep: "brands",
                                selectedBrand: undefined,
                                selectedCategory: undefined,
                                lastProductGroups: [],
                            },
                        },
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    if (state.section === types_1.SECTION.CATALOG)
                        await (0, utils_1.safeDelete)(bot, chatId, msg.message_id);
                });
            },
            [texts_1.MENU_TEXTS.CART]: async () => {
                return (0, utils_1.guardWorkingHours)(bot, chatId, async () => {
                    (0, chat_state_1.setChatState)(chatId, {
                        section: types_1.SECTION.CART,
                        mode: "idle",
                        sections: resetCatalogIfLeaving(),
                    });
                    await (0, renderFlow_1.renderFlow)(bot, chatId);
                    if (state.section === types_1.SECTION.CART)
                        await (0, utils_1.safeDelete)(bot, chatId, msg.message_id);
                });
            },
            [texts_1.MENU_TEXTS.ORDERS]: async () => {
                const defaultFlowStep = (0, users_service_1.isAdmin)(chatId) ? "main" : "orders";
                (0, chat_state_1.setChatState)(chatId, {
                    section: types_1.SECTION.ORDERS,
                    mode: "idle",
                    sections: {
                        ...resetCatalogIfLeaving(),
                        [types_1.SECTION.ORDERS]: {
                            ...state.sections?.[types_1.SECTION.ORDERS],
                            page: 1,
                            totalPages: 1,
                            selectedUserId: undefined,
                            flowStep: state.sections?.[types_1.SECTION.ORDERS]?.flowStep ?? defaultFlowStep,
                        },
                    },
                });
                await (0, orders_handler_1.ordersHandler)(bot, chatId);
                if (state.section === types_1.SECTION.ORDERS)
                    await (0, utils_1.safeDelete)(bot, chatId, msg.message_id);
            },
            [texts_1.MENU_TEXTS.ADMIN_PANEL]: async () => {
                (0, chat_state_1.setChatState)(chatId, {
                    section: types_1.SECTION.ADMIN_PANEL,
                    mode: "idle",
                    sections: {
                        ...resetCatalogIfLeaving(),
                        [types_1.SECTION.ADMIN_PANEL]: {
                            ...state.sections?.[types_1.SECTION.ADMIN_PANEL],
                            flowStep: state.sections?.[types_1.SECTION.ADMIN_PANEL]?.flowStep ?? "main",
                            users: {
                                page: 1,
                                totalPages: 1,
                                editingUserId: undefined,
                                newUserId: undefined,
                            }
                        }
                    }
                });
                await (0, renderScreen_1.renderScreen)(bot, chatId, {
                    section: types_1.SECTION.ADMIN_PANEL,
                    text: texts_1.START_TEXTS.ADMIN_PANEL,
                    inlineKeyboard: (0, keyboards_1.adminKeyboard)(),
                    parse_mode: "HTML",
                });
                if (state.section === types_1.SECTION.ADMIN_PANEL)
                    await (0, utils_1.safeDelete)(bot, chatId, msg.message_id);
            },
            [texts_1.MENU_TEXTS.MANAGER]: async () => {
                const managerUrl = user.role === "retail"
                    ? env_1.ENV.RETAIL_MANAGER_URL
                    : env_1.ENV.WHOLESALE_MANAGER_URL;
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
            await (0, utils_1.safeDelete)(bot, msg.message_id);
            return;
        }
        // ------------------------
        // 2️⃣ Обработка режимов (mode)
        // ------------------------
        const modeHandlers = {
            add_user: async (t) => await (0, addUser_handler_1.addUserInputHandler)(bot, chatId, t),
            delete_user: async (t) => await (0, deleteUser_handler_1.deleteUserInputHandler)(bot, chatId, t),
            edit_user: async (t) => await (0, editUser_handler_1.editUserInputHandler)(bot, chatId, t),
            edit_rub_to_byn: async (t) => await (0, price_handler_1.editPriceInputHandler)(bot, chatId, t),
            edit_rub_to_usd: async (t) => await (0, price_handler_1.editPriceInputHandler)(bot, chatId, t),
            edit_usd_to_byn: async (t) => await (0, price_handler_1.editPriceInputHandler)(bot, chatId, t),
            await_users_page_number: async (t) => {
                await (0, users_service_1.usersPageInputHandler)(bot, chatId, t);
                (0, chat_state_1.setChatState)(chatId, { mode: "idle" });
            },
            await_orders_page_number: async (t) => {
                await (0, orders_handler_1.ordersPageInputHandler)(bot, chatId, t);
                (0, chat_state_1.setChatState)(chatId, { mode: "idle" });
            },
            choose_userId_for_orders: async (t) => {
                const userId = Number(t);
                if (Number.isNaN(userId)) {
                    await (0, renderScreen_1.renderScreen)(bot, chatId, {
                        section: types_1.SECTION.ORDERS,
                        text: texts_1.USERS_ERRORS.ID_NUMBER,
                        withBackButton: true,
                    });
                    return;
                }
                await (0, orders_handler_1.ordersHandler)(bot, chatId, userId);
                (0, chat_state_1.setChatState)(chatId, { mode: "idle" });
            },
            // ------------------------
            // Корзина
            // ------------------------
            amount_product_for_cart: async (t) => {
                const amount = Number(t);
                if (Number.isNaN(amount)) {
                    await (0, renderScreen_1.renderScreen)(bot, chatId, { section: types_1.SECTION.CART, text: texts_1.CART_TEXTS.AMOUNT_WILL_BE_NUMBER });
                    return;
                }
                const role = (0, users_service_1.getUserRole)(chatId);
                const choseProduct = (0, catalog_ui_1.getCatalogProductById)(state.sections.cart?.selectedProductId, role);
                if (!choseProduct) {
                    await (0, renderScreen_1.renderScreen)(bot, chatId, { section: types_1.SECTION.CART, text: texts_1.CART_TEXTS.PRODUCT_UNAVAILABLE });
                    return;
                }
                const productForOrder = { ...choseProduct, amount };
                const currentOrder = [...(state.sections.cart?.currentOrder || []), productForOrder];
                (0, chat_state_1.setChatState)(chatId, {
                    mode: "idle",
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...state.sections?.[types_1.SECTION.CART],
                            selectedProductId: undefined,
                            flowStep: "products_for_cart",
                            currentOrder,
                        },
                    },
                });
                await (0, renderFlow_1.renderFlow)(bot, chatId);
            },
            edit_product_amount_in_cart: async (t) => {
                if (!state.sections.cart?.currentOrder?.length || !state.sections.cart.selectedProductIdForCart)
                    return;
                const amount = Number(t);
                if (Number.isNaN(amount))
                    return;
                const updatedOrder = state.sections.cart.currentOrder.map((p) => p.id === state.sections.cart?.selectedProductIdForCart ? { ...p, amount } : p);
                (0, chat_state_1.setChatState)(chatId, {
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.CART]: {
                            ...state.sections?.[types_1.SECTION.CART],
                            currentOrder: updatedOrder,
                        },
                    },
                });
                await (0, renderFlow_1.renderFlow)(bot, chatId);
            },
        };
        const handler = modeHandlers[state.mode];
        if (handler) {
            await handler(text);
            // Удаляем сообщение пользователя после обработки
            await (0, utils_1.safeDelete)(bot, chatId, msg.message_id);
            return;
        }
    });
}
