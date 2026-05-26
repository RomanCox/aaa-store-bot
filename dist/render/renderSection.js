"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSection = renderSection;
const renderFlow_1 = require("./renderFlow");
const types_1 = require("../types");
const admin_service_1 = require("../services/admin.service");
const texts_1 = require("../texts");
const keyboards_1 = require("../keyboards");
const renderScreen_1 = require("./renderScreen");
const chat_state_1 = require("../state/chat.state");
const orders_handler_1 = require("../handlers/orders.handler");
async function renderSection(bot, chatId) {
    const state = (0, chat_state_1.getChatState)(chatId);
    if (state.section === types_1.SECTION.ADMIN_PANEL) {
        const adminState = state.sections?.[types_1.SECTION.ADMIN_PANEL];
        if (!adminState || adminState.flowStep === "main") {
            await (0, renderScreen_1.renderScreen)(bot, chatId, {
                section: types_1.SECTION.ADMIN_PANEL,
                text: texts_1.START_TEXTS.ADMIN_PANEL,
                inlineKeyboard: (0, keyboards_1.adminKeyboard)(),
                parse_mode: "HTML",
            });
            return;
        }
        if (adminState.flowStep === "manage_users") {
            await (0, admin_service_1.startUserManagement)(bot, chatId);
            return;
        }
    }
    if (state.section === types_1.SECTION.CATALOG) {
        await (0, renderFlow_1.renderFlow)(bot, chatId);
        return;
    }
    if (state.section === types_1.SECTION.CART) {
        await (0, renderFlow_1.renderFlow)(bot, chatId);
        return;
    }
    if (state.section === types_1.SECTION.ORDERS) {
        const ordersState = state.sections?.[types_1.SECTION.ORDERS];
        await (0, orders_handler_1.ordersHandler)(bot, chatId, ordersState?.flowStep !== "main"
            ? ordersState?.selectedUserId
            : undefined);
        return;
    }
}
