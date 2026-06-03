"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersHandler = ordersHandler;
exports.ordersPageInputHandler = ordersPageInputHandler;
exports.orderHandler = orderHandler;
const texts_1 = require("../texts");
const chat_state_1 = require("../state/chat.state");
const orders_service_1 = require("../services/orders.service");
const types_1 = require("../types");
const utils_1 = require("../utils");
const users_service_1 = require("../services/users.service");
const renderScreen_1 = require("../render/renderScreen");
const constants_1 = require("../constants");
async function ordersHandler(bot, chatId, userId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const ordersState = state.sections?.[types_1.SECTION.ORDERS];
    let text = texts_1.ORDER_TEXTS.ENTER_USER_ID;
    const buttons = [];
    // --- ADMIN ---
    if ((0, users_service_1.isAdmin)(chatId)) {
        (0, chat_state_1.setChatState)(chatId, {
            mode: "idle",
            sections: {
                ...state.sections,
                [types_1.SECTION.ORDERS]: {
                    ...state.sections?.[types_1.SECTION.ORDERS],
                    selectedUserId: userId,
                    page: 1,
                    totalPages: state.sections?.[types_1.SECTION.ORDERS]?.totalPages ?? 1,
                    flowStep: state.sections?.[types_1.SECTION.ORDERS]?.flowStep ?? "main",
                },
            },
        });
        if (userId) {
            const orders = (0, orders_service_1.getOrdersByUserId)(Number(userId));
            if (!orders.length) {
                text = texts_1.ORDER_TEXTS.NO_ORDERS_FOR_ADMIN;
                (0, chat_state_1.setChatState)(chatId, {
                    mode: "idle",
                    sections: {
                        ...state.sections,
                        [types_1.SECTION.ORDERS]: {
                            ...state.sections?.[types_1.SECTION.ORDERS],
                            selectedUserId: userId,
                            page: 1,
                            totalPages: state.sections?.[types_1.SECTION.ORDERS]?.totalPages ?? 1,
                            flowStep: "orders",
                        },
                    },
                });
                await (0, renderScreen_1.renderScreen)(bot, chatId, {
                    section: types_1.SECTION.ORDERS,
                    text,
                    parse_mode: "HTML",
                    withBackButton: true,
                });
                return;
            }
            text = texts_1.ORDER_TEXTS.CHOOSE_ORDER;
            for (const order of orders) {
                buttons.push([
                    {
                        text: buttonText(order),
                        callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.CHOOSE_ORDER, order.id),
                    },
                ]);
            }
        }
        else {
            (0, chat_state_1.setChatState)(chatId, {
                mode: "choose_userId_for_orders",
                section: types_1.SECTION.ORDERS,
            });
        }
    }
    // --- USER ---
    else {
        const orders = (0, orders_service_1.getOrdersByUserId)(chatId);
        text =
            orders.length > 0
                ? texts_1.ORDER_TEXTS.CHOOSE_ORDER
                : texts_1.ORDER_TEXTS.NO_ORDERS;
        for (const order of orders) {
            buttons.push([
                {
                    text: buttonText(order),
                    callback_data: (0, utils_1.buildCallbackData)(types_1.CALLBACK_TYPE.CHOOSE_ORDER, order.id),
                },
            ]);
        }
        const ordersPage = ordersState?.page ?? 1;
        const ordersTotalPages = Math.max(1, Math.ceil(orders.length / constants_1.ORDERS_PER_PAGE));
        if (orders.length > constants_1.ORDERS_PER_PAGE) {
            buttons.push((0, utils_1.addPaginationButtons)(ordersPage, ordersTotalPages, types_1.CALLBACK_TYPE.ORDERS));
        }
    }
    function buttonText(order) {
        const date = new Date(order.createdAt);
        const formattedDate = date.toLocaleDateString("ru-RU");
        return (texts_1.ORDER_TEXTS.ORDER_ID +
            order.id +
            texts_1.ORDER_TEXTS.ORDER_FROM +
            formattedDate);
    }
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.ORDERS,
        text,
        inlineKeyboard: buttons,
        parse_mode: "HTML",
        withBackButton: ((0, users_service_1.isAdmin)(chatId) && !!userId),
    });
}
async function ordersPageInputHandler(bot, chatId, text) {
    const page = Number(text);
    const state = (0, chat_state_1.getChatState)(chatId);
    // безопасный доступ к orders
    const ordersState = state.sections?.[types_1.SECTION.ORDERS];
    const totalPages = ordersState?.totalPages ?? 1;
    if (!Number.isInteger(page) || page < 1) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ORDERS,
            text: texts_1.PAGINATION_TEXTS.ERROR_PAGE,
        });
        return;
    }
    if (page > totalPages) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ORDERS,
            text: texts_1.PAGINATION_TEXTS.PAGE_FROM_TO + totalPages,
        });
        return;
    }
    (0, chat_state_1.setChatState)(chatId, {
        sections: {
            ...state.sections,
            [types_1.SECTION.ORDERS]: {
                ...ordersState,
                page,
                totalPages,
                flowStep: "orders",
            },
        },
    });
    await ordersHandler(bot, chatId);
}
async function orderHandler(bot, chatId, orderId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    const ordersState = state.sections?.[types_1.SECTION.ORDERS];
    const userId = (0, users_service_1.isAdmin)(chatId) ? Number(ordersState?.selectedUserId) : chatId;
    const order = (0, users_service_1.isAdmin)(chatId)
        ? (0, orders_service_1.getOrdersForAdmin)().find(o => o.id === orderId)
        : (0, orders_service_1.getOrdersByUserId)(chatId).find(o => o.id === orderId);
    if (!order || !userId) {
        await (0, renderScreen_1.renderScreen)(bot, chatId, {
            section: types_1.SECTION.ORDERS,
            text: texts_1.ORDER_TEXTS.ORDER_NOT_FOUND,
        });
        return;
    }
    const message = (0, orders_service_1.buildOrderMessage)(order, userId, true, (0, users_service_1.isAdmin)(chatId));
    await (0, renderScreen_1.renderScreen)(bot, chatId, {
        section: types_1.SECTION.ORDERS,
        text: message,
        parse_mode: "HTML",
        withBackButton: true,
    });
}
